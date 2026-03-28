/**
 * Validierungs-Utility-Funktionen
 */

/**
 * Validiert eine URL
 * @param {string} url - Die zu validierende URL
 * @returns {boolean} true wenn gültig
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Füge Protokoll hinzu falls nicht vorhanden
    let testUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      testUrl = 'http://' + url;
    }
    
    const urlObj = new URL(testUrl);
    
    // Prüfe ob Hostname existiert
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }
    
    // Prüfe grundlegende Domain-Struktur (mindestens ein Punkt oder localhost)
    if (!urlObj.hostname.includes('.') && urlObj.hostname !== 'localhost') {
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validiert eine Email-Adresse
 * @param {string} email - Die zu validierende Email
 * @returns {boolean} true wenn gültig
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 vereinfachtes Pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailPattern.test(email.trim());
}

/**
 * Validiert eine IP-Adresse (IPv4 oder IPv6)
 * @param {string} ip - Die zu validierende IP
 * @returns {boolean} true wenn gültig
 */
function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 Pattern
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 Pattern (vereinfacht)
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Sanitiert einen String (entfernt gefährliche Zeichen)
 * @param {string} str - Der zu bereinigende String
 * @returns {string} Bereinigter String
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Entferne < und >
    .substring(0, 1000); // Maximale Länge
}

/**
 * Validiert einen VLAN-Namen
 * @param {string} name - Der VLAN-Name
 * @returns {boolean} true wenn gültig
 */
function isValidVlanName(name) {
  if (!name || typeof name !== 'string') return false;
  
  // VLAN-Namen: alphanumerisch, max 255 Zeichen
  const vlanPattern = /^[a-zA-Z0-9_-]{1,255}$/;
  
  return vlanPattern.test(name.trim());
}

/**
 * Validiert Whitelist-Name
 * @param {string} name - Der Whitelist-Name
 * @returns {boolean} true wenn gültig
 */
function isValidWhitelistName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  return trimmed.length > 0 && trimmed.length <= 255;
}

/**
 * Prüft ob ein Wert eine positive Ganzzahl ist
 * @param {any} value - Der zu prüfende Wert
 * @returns {boolean} true wenn positive Ganzzahl
 */
function isPositiveInteger(value) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && num === parseFloat(value);
}

module.exports = {
  isValidUrl,
  isValidEmail,
  isValidIp,
  sanitizeString,
  isValidVlanName,
  isValidWhitelistName,
  isPositiveInteger
};
