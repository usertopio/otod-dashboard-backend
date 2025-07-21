const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const aNewFields = [
  "recId",
  "province",
  "newsId",
  "announceDate",
  "newsGroup",
  "newsTopic",
  "newsDetail",
  "noOfLike",
  "noOfComments",
  "createdTime",
  "updatedTime",
  "companyId",
  "companyName",
];

const newsSummaryByMonthFields = [
  "province",
  "announceMonth",
  "newsGroup",
  "totalNews",
  "totalLike",
  "totalComments",
];

module.exports = {
  connectionDB,
  aNewFields,
  newsSummaryByMonthFields,
};
