const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'provisioning',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONN_LIMIT ? parseInt(process.env.DB_CONN_LIMIT, 10) : 10,
  queueLimit: 0
});

async function testConnection(retries = 1, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await pool.getConnection();
      await conn.query('SELECT 1');
      conn.release();
      console.log('MySQL verbunden (Host: ' + (process.env.DB_HOST || 'localhost') + ', DB: ' + (process.env.DB_NAME || 'provisioning') + ').');
      return;
    } catch (err) {
      const msg = 'MySQL Verbindung fehlgeschlagen (Versuch ' + attempt + '): ' + err.message;
      console.error(msg);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

// export pool for compatibility, and attach test helper
module.exports = pool;
module.exports.testConnection = testConnection;
