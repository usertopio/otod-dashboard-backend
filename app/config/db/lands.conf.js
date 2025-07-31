const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const landFields = [
  "recId",
  "province",
  "amphur",
  "tambon",
  "farmerId",
  "title",
  "firstName",
  "lastName",
  "landId",
  "landType",
  "lat",
  "lon",
  "latDegrees",
  "latMinutes",
  "latSeconds",
  "latDirection",
  "lonDegrees",
  "lonMinutes",
  "lonSeconds",
  "lonDirection",
  "noOfRais",
  "noOfNgan",
  "noOfWah",
  "kml",
  "createdTime",
  "updatedTime",
  "companyId",
  "companyName",
];

module.exports = { connectionDB, landFields };
