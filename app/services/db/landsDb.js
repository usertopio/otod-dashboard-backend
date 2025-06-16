const {
  connectionDB,
  landFields,
  landSummaryFields,
} = require("../../config/db/land.conf.js");

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

// Function to insert a land summary into the database, one by one
const insertLandSummary = (landSummary) => {
  // Query to insert a land summary into the database
  const insertLandSummaryQuery = `
    INSERT INTO land_summary (${landSummaryFields.join(", ")})
    VALUES (${landSummaryFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = landSummaryFields.map((landSummaryField) => {
    return landSummary[landSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertLandSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert LandSummary error:", err);
    }
  });
};

module.exports = { insertLand, insertLandSummary };
