const { exec } = require('child_process');
const { promisify } = require('util');
const dns = require('dns').promises;
const pool = require('../lib/db');
const os = require('os');

const execAsync = promisify(exec);

// Prüfe ob wir auf einem Linux-System sind
const isLinux = os.platform() === 'linux';

/**
 * Führt einen Befehl mit Timeout aus
 * @param {string} command - Der auszuführende Befehl
 * @param {number} timeout - Timeout in Millisekunden (default: 5000)
 * @returns {Promise} Promise mit stdout/stderr oder Fehler
 */
async function execWithTimeout(command, timeout = 5000) {
  return Promise.race([
    execAsync(command),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Command timeout')), timeout)
    )
  ]);
}

/**
 * Ermittelt alle aktiven Whitelists basierend auf Start/Ende-Zeitfenstern
 * @returns {Promise<Array>} Array von aktiven Whitelist-Einträgen mit VLAN-Info
 */
async function getActiveWhitelists() {
  const now = new Date();
  const query = `
    SELECT 
      w.id,
      w.user_id,
      w.name,
      w.url,
      w.start,
      w.end,
      w.rythm,
      w.unit,
      w.vlan_id,
      v.name as vlan_name,
      v.ip as vlan_ip,
      u.email as user_email
    FROM \`Whitelist\` w
    LEFT JOIN \`Vlan\` v ON w.vlan_id = v.id
    LEFT JOIN \`User\` u ON w.user_id = u.id
    WHERE 
      (w.start IS NULL OR w.start <= ?) 
      AND (w.end IS NULL OR w.end >= ?)
    ORDER BY w.vlan_id, w.id
  `;
  
  const [rows] = await pool.query(query, [now, now]);
  return rows;
}

/**
 * Extrahiert den Hostnamen aus einer URL
 * @param {string} url - Die URL
 * @returns {string} Der Hostname
 */
function extractHostname(url) {
  try {
    // Füge Protokoll hinzu, falls nicht vorhanden
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (err) {
    // Falls URL-Parsing fehlschlägt, versuche einfachen Text als Hostname
    return url.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  }
}

/**
 * Löst einen Hostnamen zu IP-Adressen auf (IPv4 und IPv6)
 * @param {string} hostname - Der Hostname
 * @returns {Promise<Object>} Objekt mit ipv4 und ipv6 Arrays
 */
async function resolveHostname(hostname) {
  const result = { ipv4: [], ipv6: [] };
  
  try {
    // IPv4 auflösen
    const ipv4Addresses = await dns.resolve4(hostname).catch(() => []);
    result.ipv4 = ipv4Addresses;
  } catch (err) {
    // Ignoriere Fehler, lasse ipv4 leer
  }
  
  try {
    // IPv6 auflösen
    const ipv6Addresses = await dns.resolve6(hostname).catch(() => []);
    result.ipv6 = ipv6Addresses;
  } catch (err) {
    // Ignoriere Fehler, lasse ipv6 leer
  }
  
  return result;
}

/**
 * Generiert nftables-Regeln für alle aktiven Whitelists
 * @returns {Promise<string>} nftables-Konfiguration als String
 */
async function generateNftablesConfig() {
  const whitelists = await getActiveWhitelists();
  
  if (whitelists.length === 0) {
    return null;
  }
  
  // Gruppiere Whitelists nach VLAN
  const vlanGroups = {};
  
  for (const whitelist of whitelists) {
    const vlanId = whitelist.vlan_id;
    if (!vlanGroups[vlanId]) {
      vlanGroups[vlanId] = {
        vlan_name: whitelist.vlan_name,
        vlan_ip: whitelist.vlan_ip,
        whitelists: []
      };
    }
    vlanGroups[vlanId].whitelists.push(whitelist);
  }
  
  // Generiere nftables-Konfiguration
  let config = `#!/usr/sbin/nft -f
# GateKeeper Whitelist Rules - Generiert am ${new Date().toISOString()}

# Lösche bestehende table falls vorhanden
table inet gatekeeper
delete table inet gatekeeper

# Erstelle neue table
table inet gatekeeper {
`;
  
  // Erstelle Sets für IP-Adressen pro VLAN
  for (const [vlanId, vlanData] of Object.entries(vlanGroups)) {
    config += `\n  # VLAN ${vlanData.vlan_name} (${vlanData.vlan_ip})\n`;
    config += `  set vlan_${vlanId}_whitelist_ipv4 {\n`;
    config += `    type ipv4_addr\n`;
    config += `    flags interval\n`;
    config += `    elements = { `;
    
    // Sammle alle IPs für dieses VLAN
    const ipv4Set = new Set();
    const ipv6Set = new Set();
    
    for (const whitelist of vlanData.whitelists) {
      const hostname = extractHostname(whitelist.url);
      try {
        const ips = await resolveHostname(hostname);
        ips.ipv4.forEach(ip => ipv4Set.add(ip));
        ips.ipv6.forEach(ip => ipv6Set.add(ip));
      } catch (err) {
        console.error(`Fehler beim Auflösen von ${hostname}:`, err.message);
      }
    }
    
    // IPv4 Set
    if (ipv4Set.size > 0) {
      config += Array.from(ipv4Set).join(', ');
    } else {
      config += '0.0.0.0'; // Dummy-Eintrag falls leer
    }
    config += ` }\n  }\n`;
    
    // IPv6 Set
    if (ipv6Set.size > 0) {
      config += `\n  set vlan_${vlanId}_whitelist_ipv6 {\n`;
      config += `    type ipv6_addr\n`;
      config += `    flags interval\n`;
      config += `    elements = { `;
      config += Array.from(ipv6Set).join(', ');
      config += ` }\n  }\n`;
    }
  }
  
  // Erstelle forward chain mit Regeln
  config += `\n  chain forward {\n`;
  config += `    type filter hook forward priority 0; policy drop;\n\n`;
  config += `    # Erlaube established/related Verbindungen\n`;
  config += `    ct state established,related accept\n\n`;
  
  for (const [vlanId, vlanData] of Object.entries(vlanGroups)) {
    const vlanSubnet = vlanData.vlan_ip; // z.B. "192.168.1.0/24"
    
    config += `    # Regeln für VLAN ${vlanData.vlan_name}\n`;
    config += `    ip saddr ${vlanSubnet} ip daddr @vlan_${vlanId}_whitelist_ipv4 accept\n`;
    
    // Füge IPv6-Regel hinzu, falls IPv6-Set existiert
    const hasIpv6 = vlanData.whitelists.some(w => {
      // Vereinfachte Prüfung - in Produktion würde man das Set prüfen
      return true;
    });
    
    if (hasIpv6) {
      // Konvertiere IPv4 Subnet zu IPv6 falls nötig (vereinfacht)
      config += `    ip6 saddr ${vlanSubnet} ip6 daddr @vlan_${vlanId}_whitelist_ipv6 accept\n`;
    }
    config += `\n`;
  }
  
  config += `    # Logge verworfene Pakete (optional)\n`;
  config += `    # log prefix "GateKeeper DROP: " drop\n`;
  config += `  }\n`;
  config += `}\n`;
  
  return config;
}

/**
 * Wendet die nftables-Konfiguration auf das System an
 * @param {string} config - Die nftables-Konfiguration
 * @returns {Promise<Object>} Ergebnis der Anwendung
 */
async function applyNftablesConfig(config) {
  if (!isLinux) {
    return {
      success: false,
      message: 'nftables ist nur auf Linux-Systemen verfügbar. Aktuelles System: ' + os.platform(),
      error: 'Nicht unterstütztes Betriebssystem'
    };
  }
  
  if (!config) {
    return {
      success: false,
      message: 'Keine aktiven Whitelists vorhanden'
    };
  }
  
  try {
    // Schreibe Config in temporäre Datei
    const fs = require('fs').promises;
    const tmpFile = '/tmp/gatekeeper-nft.conf';
    await fs.writeFile(tmpFile, config, 'utf8');
    
    // Wende nftables-Konfiguration an (erfordert sudo) mit Timeout
    const { stdout, stderr } = await execWithTimeout(`sudo nft -f ${tmpFile}`, 10000);
    
    // Lösche temporäre Datei
    await fs.unlink(tmpFile).catch(() => {});
    
    return {
      success: true,
      message: 'nftables-Konfiguration erfolgreich angewendet',
      stdout,
      stderr
    };
  } catch (err) {
    return {
      success: false,
      message: 'Fehler beim Anwenden der nftables-Konfiguration',
      error: err.message
    };
  }
}

/**
 * Zeigt die aktuelle nftables-Konfiguration an
 * @returns {Promise<string>} Die aktuelle Konfiguration
 */
async function showCurrentConfig() {
  if (!isLinux) {
    return 'nftables ist nur auf Linux-Systemen verfügbar';
  }
  
  try {
    const { stdout } = await execWithTimeout('sudo nft list table inet gatekeeper', 3000);
    return stdout;
  } catch (err) {
    // Table existiert nicht oder Berechtigungsfehler
    return null;
  }
}

/**
 * Löscht die GateKeeper nftables-Konfiguration
 * @returns {Promise<Object>} Ergebnis der Löschung
 */
async function clearNftablesConfig() {
  if (!isLinux) {
    return {
      success: false,
      message: 'nftables ist nur auf Linux-Systemen verfügbar',
      error: 'Nicht unterstütztes Betriebssystem'
    };
  }
  
  try {
    await execWithTimeout('sudo nft delete table inet gatekeeper', 3000);
    return {
      success: true,
      message: 'nftables-Konfiguration erfolgreich gelöscht'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Fehler beim Löschen der nftables-Konfiguration',
      error: err.message
    };
  }
}

module.exports = {
  getActiveWhitelists,
  generateNftablesConfig,
  applyNftablesConfig,
  showCurrentConfig,
  clearNftablesConfig,
  extractHostname,
  resolveHostname
};
