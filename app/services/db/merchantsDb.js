const {
  connectionDB,
  merchantsFields,
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

// const insertCommunitySummary = (communitySummary) => {
//   // Query to insert a land into the database
//   const insertCommunitySummaryQuery = `
//           INSERT INTO community_summary (${communitySummaryFields.join(", ")})
//           VALUES (${communitySummaryFields.map(() => "?").join(", ")})`;

//   // Prepare the values to be inserted
//   const values = communitySummaryFields.map((communitySummaryField) => {
//     return communitySummary[communitySummaryField];
//   });

//   // Execute the insert query with the prepared values
//   connectionDB.query(insertCommunitySummaryQuery, values, (err) => {
//     if (err) {
//       console.error("Insert error:", err);
//     }
//   });
// };

module.exports = { insertMerchants };
