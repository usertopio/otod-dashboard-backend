const mysql = require("mysql2");

const connectionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "otod-test",
});

const landGeoJSONFields = [
  "landId",
  "farmerId",
  "landType",
  "lat",
  "lon",
  "noOfRais",
  "noOfNgan",
  "noOfWah",
  "geojson",
  "fetchedAt",
];

module.exports = { connectionDB, landGeoJSONFields };
