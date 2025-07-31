const {
  connectionDB,
  operationFields,
} = require("../../config/db/operations.conf.js");

// Function to insert a land into the database, one by one

const insertOperations = (operation) => {
  // Query to insert a land into the database
  const insertOperationsQuery = `
          INSERT INTO operations (${operationFields.join(", ")})
          VALUES (${operationFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = operationFields.map((operationField) => {
    return operation[operationField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertOperationsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertOperations };
