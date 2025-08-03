const { connectionDB, aNewFields } = require("../../config/db/news.conf.js");

// Function to insert a new into the database, one by one
const insertANew = (aNew) => {
  // Query to insert a new into the database
  const insertANewQuery = `
          INSERT INTO news (${aNewFields.join(", ")})
          VALUES (${aNewFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted, handling empty date fields
  // by inserting null instead of an empty string
  const values = aNewFields.map((aNewField) => {
    return aNew[aNewField] || null;
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertANewQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = {
  insertANew,
};
