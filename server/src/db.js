// server/src/db.js
import mysql from 'mysql2/promise';

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'ol_time_muscle'
} = process.env;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


export async function testDB() {
  try {
    const [rows] = await pool.query(
      "SELECT CURRENT_USER() AS user, DATABASE() AS db, NOW() AS now"
    );
    console.log("✅ MySQL Connected:", rows[0]);
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
}

