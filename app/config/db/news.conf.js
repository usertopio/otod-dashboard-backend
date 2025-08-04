const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod",
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

module.exports = {
  connectionDB,
  aNewFields,
};
