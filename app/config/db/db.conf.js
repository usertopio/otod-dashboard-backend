// Load environment variables FIRST
import "dotenv/config";
import mysql from "mysql2";

// Use a connection pool to avoid idle timeout errors
let _pool = null;

function getConnection() {
  if (!_pool) {
    console.log("🔍 Creating DB connection pool with:");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER ? "***" : "UNDEFINED");
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "UNDEFINED");
    console.log("DB_NAME:", process.env.DB_NAME);

    _pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return _pool;
}

// Export a named binding so existing imports keep working
export const connectionDB = getConnection();
