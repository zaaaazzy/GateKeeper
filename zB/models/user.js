const pool = require('../lib/db');
const { hashPassword } = require('../lib/password');


async function createUser({ email, password, nom, prenom, role }) {
  const hashed = await hashPassword(password);
  const [result] = await pool.query(
    `INSERT INTO ` + '\`User\`' + ` (email, password, nom, prenom, role_id) VALUES (?, ?, ?, ?, ?)`,
    [ email, hashed, nom, prenom, role]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT * FROM ` + '\`User\`' + ` WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByUsername(email) {
  const [rows] = await pool.query(
    `SELECT User.id as id, User.email, User.password, User.nom, User.prenom, User.role_id, User.active, Role.name as role_name 
     FROM ` + '\`User\`' + ` 
     LEFT JOIN ` + '\`Role\`' + ` ON Role.id = User.role_id 
     WHERE User.email = ?`, 
    [email]
  );
  console.log('findByUsername result:', rows[0]);
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query(`SELECT id, email, nom, prenom, role_id, active FROM ` + '\`User\`' + ` ORDER BY id`);
  return rows;
}

async function updateUser(id, fields) {
  const sets = [];
  const values = [];
  for (const k of Object.keys(fields)) {
    if (fields[k] !== undefined && fields[k] !== null) {
      sets.push(`${k} = ?`);
      values.push(fields[k]);
    }
  }
  if (sets.length === 0) {
    console.log('Keine Updates - alle Felder leer');
    return;
  }
  values.push(id);
  const query = `UPDATE ` + '\`User\`' + ` SET ${sets.join(', ')} WHERE id = ?`;
  await pool.query(query, values);
  console.log('Update erfolgreich für User ID:', id);
}

async function deleteUser(id) {
  await pool.query(`DELETE FROM ` + '\`User\`' + ` WHERE id = ?`, [id]);
}

module.exports = {
  createUser,
  findById,
  findByUsername,
  findAll,
  updateUser,
  deleteUser,
};
