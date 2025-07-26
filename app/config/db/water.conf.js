const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const waterUsageSummaryByCropFields = [
  "cropYear",
  "provinceName",
  "operMonth",
  "totalLitre",
];

const waterUsageSummaryByMonthFields = [
  "cropYear",
  "provinceName",
  "operMonth",
  "totalLitre",
];

module.exports = {
  connectionDB,
  waterUsageSummaryByCropFields,
  waterUsageSummaryByMonthFields,
};
