const { connectionDB, farmerFields } = require("../../config/db.conf.js");

const insertFarmers = (farmer) => {
  const insertFarmersQuery = `
          INSERT INTO farmers (${farmerFields.join(", ")})
          VALUES (${farmerFields.map(() => "?").join(", ")})`;

  connectionDB.query(
    insertFarmersQuery,
    farmerFields.map((farmerField) => {
      if (farmerField === "idCardExpiryDate" && farmer[farmerField] === "") {
        return null;
      }
      return farmer[farmerField];
    }),
    (err) => {
      if (err) {
        console.error("Insert error:", err);
      }
    }
  );
};

module.exports = { insertFarmers };
