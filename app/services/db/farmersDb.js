const {
  connectionDB,
  farmerFields,
  farmerSummaryFields,
} = require("../../config/db.conf.js");

// Function to insert a farmer into the database, one by one
const insertFarmer = (farmer) => {
  // Query to insert a farmer into the database
  const insertFarmersQuery = `
          INSERT INTO farmers (${farmerFields.join(", ")})
          VALUES (${farmerFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted, handling empty idCardExpiryDate
  // by inserting null instead of an empty string
  const values = farmerFields.map((farmerField) => {
    if (farmerField === "idCardExpiryDate" && farmer[farmerField] === "") {
      return null;
    }
    return farmer[farmerField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertFarmersQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

// Function to insert a farmer summary into the database, one by one
const insertFarmerSummary = (farmerSummary) => {
  // Query to insert a farmer summary into the database
  const insertFarmerSummaryQuery = `
    INSERT INTO farmer_summary (${farmerSummaryFields.join(", ")})
    VALUES (${farmerSummaryFields.map(() => "?").join(", ")})
  `;

  // Log
  console.log("FarmerSummary:", farmerSummary);

  // // Execute the insert query with the prepared values
  // connectionDB.query(insertFarmerSummaryQuery, farmerSummary, (err) => {
  //   if (err) {
  //     console.error("Insert FarmerSummary error:", err);
  //   }
  // });
};

module.exports = { insertFarmer, insertFarmerSummary };
