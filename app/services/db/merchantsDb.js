const {
  connectionDB,
  merchantsFields,
  merchantSummaryFields,
} = require("../../config/db/merchants.conf.js");

// Function to insert a land into the database, one by one

const insertMerchants = (merchant) => {
  // Query to insert a land into the database
  const insertMerchantsQuery = `
          INSERT INTO merchants (${merchantsFields.join(", ")})
          VALUES (${merchantsFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = merchantsFields.map((merchantsField) => {
    return merchant[merchantsField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertMerchantsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

const insertMerchantSummary = (merchantSummary) => {
  // Query to insert a land into the database
  const insertMerchantSummaryQuery = `
          INSERT INTO merchant_summary (${merchantSummaryFields.join(", ")})
          VALUES (${merchantSummaryFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = merchantSummaryFields.map((merchantSummaryField) => {
    return merchantSummary[merchantSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertMerchantSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertMerchants, insertMerchantSummary };
