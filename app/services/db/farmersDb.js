const { connectionDB, farmerFields } = require("../../config/db.conf.js");

const insertFarmer = (farmer) => {
  const insertFarmersQuery = `
          INSERT INTO farmers (${farmerFields.join(", ")})
          VALUES (${farmerFields.map(() => "?").join(", ")})`;

  const values = farmerFields.map((farmerField) => {
    if (farmerField === "idCardExpiryDate" && farmer[farmerField] === "") {
      return null;
    }
    return farmer[farmerField];
  });

  connectionDB.query(insertFarmersQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertFarmer };
