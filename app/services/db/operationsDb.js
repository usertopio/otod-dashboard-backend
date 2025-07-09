const {
  connectionDB,
  operationFields,
  operationSummaryFields,
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

const insertOperationSummary = (operationSummary) => {
  // Query to insert a land into the database
  const insertOperationSummaryQuery = `
          INSERT INTO operation_summary (${operationSummaryFields.join(", ")})
          VALUES (${operationSummaryFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = operationSummaryFields.map((operationSummaryField) => {
    return operationSummary[operationSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertOperationSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertOperations, insertOperationSummary };
