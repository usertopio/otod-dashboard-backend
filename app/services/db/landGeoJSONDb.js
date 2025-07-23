const {
  connectionDB,
  landGeoJSONFields,
} = require("../../config/db/landGeoJSON.conf");

const insertLandGeoJSON = (landGeoJSON) => {
  const insertQuery = `
    INSERT INTO land_geo_json (${landGeoJSONFields.join(", ")})
    VALUES (${landGeoJSONFields.map(() => "?").join(", ")})
  `;

  const values = landGeoJSONFields.map((field) => landGeoJSON[field]);

  connectionDB.query(insertQuery, values, (err) => {
    if (err) {
      console.error("Insert landGeoJSON error:", err);
    }
  });
};

module.exports = { insertLandGeoJSON };
