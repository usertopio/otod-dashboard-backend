// Load environment variables FIRST in this file
require("dotenv").config();

const mysql = require("mysql2");

let connectionDB = null;

const getConnection = () => {
  if (!connectionDB) {
    console.log("🔍 Creating DB connection with:");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "UNDEFINED");
    console.log("DB_NAME:", process.env.DB_NAME);

    // Use mysql2 (not mysql2/promise) so .promise() method works
    connectionDB = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  return connectionDB;
};

module.exports = {
  get connectionDB() {
    return getConnection();
  },
};
