// Load environment variables FIRST
import "dotenv/config";

import mysql from "mysql2";

let _connection = null;

function getConnection() {
  if (!_connection) {
    console.log("🔍 Creating DB connection with:");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "UNDEFINED");
    console.log("DB_NAME:", process.env.DB_NAME);

    // Use mysql2 (not mysql2/promise) so .promise() method works
    _connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  return _connection;
}

// Export a named binding so existing imports like
// `import { connectionDB } from "../../config/db/db.conf.js";` keep working.
// This will initialize on first import; if you want *lazy* init per callsite,
// export getConnection() itself and adjust usages.
export const connectionDB = getConnection();
