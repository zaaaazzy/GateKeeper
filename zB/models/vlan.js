const pool = require('../lib/db');


async function createVlan({ name, ip , room_name}) {
  const [result] = await pool.query(
    `INSERT INTO ` + '\`Vlan\`' + ` (name, ip, room_name) VALUES (?, ?, ?)`,
    [ name, ip, room_name]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT * FROM ` + '\`Vlan\`' + ` WHERE id = ?`, [id]);
  return rows[0] || null;
}


async function findAll() {
  const [rows] = await pool.query(`SELECT id, name, ip, room_name  FROM ` + '\`Vlan\`' + ` ORDER BY id`);
  return rows;
}

async function updateVlan(id, fields) {
  const sets = [];
  const values = [];
  console.log(fields)
  for (const k of Object.keys(fields)) {
    sets.push(`${k} = ?`);
    values.push(fields[k]);
  }
  if (sets.length === 0) return;
  values.push(id);
  await pool.query(`UPDATE ` + '\`Vlan\`' + ` SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function deleteVlan(id) {
  await pool.query(`DELETE FROM ` + '\`Vlan\`' + ` WHERE id = ?`, [id]);
}

module.exports = {
  createVlan,
  findById,
  findAll,
  updateVlan,
  deleteVlan,
};
