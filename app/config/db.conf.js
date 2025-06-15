const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

// Farmer fields
const farmerFields = [
  "recId",
  "province",
  "amphur",
  "tambon",
  "farmerId",
  "title",
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "idCard",
  "idCardExpiryDate",
  "addr",
  "postCode",
  "email",
  "mobileNo",
  "lineId",
  "farmerRegistNumber",
  "farmerRegistType",
  "companyId",
  "companyName",
  "createdTime",
  "updatedTime",
];

// Farmer summary fields
const farmerSummaryFields = ["provinceName", "totalFarmers"];

module.exports = { connectionDB, farmerFields, farmerSummaryFields };
