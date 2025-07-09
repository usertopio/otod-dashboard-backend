const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const operationsFields = [
  "recId",
  "provinceName",
  "cropYear",
  "operId",
  "cropId",
  "operType",
  "operDate",
  "noOfWorkers",
  "workerCost",
  "fertilizerCost",
  "equipmentCost",
  "createdTime",
  "updatedTime",
  "companyId",
  "companyName",
];

const operationSummaryFields = [
  "provinceName",
  "cropYear",
  "operMonth",
  "operType",
  "ttOpers",
];

module.exports = { connectionDB, operationsFields, operationSummaryFields };
