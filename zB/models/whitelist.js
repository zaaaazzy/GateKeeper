const pool = require('../lib/db');

async function createWhitelist({ user_id, name, url, start, end, rythm, unit, vlan_id }) {
  const [result] = await pool.query(
    `INSERT INTO \`Whitelist\` (user_id, name, url, start, end, rythm, unit, vlan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, name, url, start || null, end || null, rythm || null, unit || null, vlan_id]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT * FROM \`Whitelist\` WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query(`
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
      u.email as user_email,
      v.name as vlan_name
    FROM \`Whitelist\` w
    LEFT JOIN \`User\` u ON w.user_id = u.id
    LEFT JOIN \`Vlan\` v ON w.vlan_id = v.id
    ORDER BY w.id
  `);
  return rows;
}

async function getWhitelistsByVlanAndUser(vlan_id, user_id = null) {
  let query = `
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
      u.email as user_email,
      v.name as vlan_name
    FROM \`Whitelist\` w
    LEFT JOIN \`User\` u ON w.user_id = u.id
    LEFT JOIN \`Vlan\` v ON w.vlan_id = v.id
    WHERE w.vlan_id = ?
  `;
  
  const params = [vlan_id];
  
  // Wenn user_id gesetzt ist, zusätzlich nach User filtern
  if (user_id !== null) {
    query += ` AND w.user_id = ?`;
    params.push(user_id);
  }
  
  query += ` ORDER BY w.id`;
  
  const [rows] = await pool.query(query, params);
  return rows;
}

async function updateWhitelist(id, fields) {
  const sets = [];
  const values = [];
  
  for (const k of Object.keys(fields)) {
    sets.push(`${k} = ?`);
    values.push(fields[k]);
  }
  
  if (sets.length === 0) return;
  
  values.push(id);
  await pool.query(`UPDATE \`Whitelist\` SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function deleteWhitelist(id) {
  await pool.query(`DELETE FROM \`Whitelist\` WHERE id = ?`, [id]);
}

module.exports = {
  createWhitelist,
  findById,
  findAll,
  getWhitelistsByVlanAndUser,
  updateWhitelist,
  deleteWhitelist,
};
