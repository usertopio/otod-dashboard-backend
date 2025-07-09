const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const merchantsFields = [
  "recId",
  "province",
  "amphur",
  "tambon",
  "postCode",
  "merchantId",
  "merchantName",
  "addr",
  "createdTime",
  "updatedTime",
  "companyId",
  "companyName",
];

const merchantSummaryFields = ["provinceName", "totalMerchants"];

module.exports = { connectionDB, merchantsFields, merchantSummaryFields };
