const { connectionDB, farmerFields } = require("../../config/db.conf.js");

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

module.exports = { insertFarmer };
