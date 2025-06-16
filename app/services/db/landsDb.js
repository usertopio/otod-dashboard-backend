const { connectionDB, landFields } = require("../../config/db/land.conf.js");

// Function to insert a land into the database, one by one
const insertLand = (land) => {
  // Query to insert a land into the database
  const insertLandsQuery = `
          INSERT INTO lands (${landFields.join(", ")})
          VALUES (${landFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = landFields.map((landField) => {
    return land[landField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertLandsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertLand };
