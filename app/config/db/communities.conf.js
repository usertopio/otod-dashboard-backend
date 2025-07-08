const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const communitiesFields = [
  "recId",
  "province",
  "amphur",
  "tambon",
  "postCode",
  "commId",
  "commName",
  "totalMembers",
  "noOfRais",
  "noOfTrees",
  "forecastYield",
  "createdTime",
  "updatedTime",
  "companyId",
  "companyName",
];

const communitySummaryFields = [
  "provinceName",
  "totalCommunities",
  "totalMembers",
  "totalRais",
  "totalTrees",
  "totalForecastYield",
];

module.exports = { connectionDB, communitiesFields, communitySummaryFields };
