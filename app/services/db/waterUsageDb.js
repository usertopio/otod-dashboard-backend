const {
  connectionDB,
  waterUsageSummaryByCropFields,
  waterUsageSummaryByMonthFields,
} = require("../../config/db/waterUsage.conf.js");

// Function to insert a land into the database, one by one
const insertWaterUsageSummaryByCrop = (waterUsageSummaryByCrop) => {
  // Query to insert a land into the database
  const insertWaterUsageSummaryByCropQuery = `
          INSERT INTO water_usage_summary_by_crop (${waterUsageSummaryByCropFields.join(
            ", "
          )})
          VALUES (${waterUsageSummaryByCropFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = waterUsageSummaryByCropFields.map(
    (waterUsageSummaryByCropField) => {
      return waterUsageSummaryByCrop[waterUsageSummaryByCropField];
    }
  );

  // Execute the insert query with the prepared values
  connectionDB.query(insertWaterUsageSummaryByCropQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

// Function to insert a land summary into the database, one by one
const insertWaterUsageSummaryByMonth = (waterUsageSummaryByMonth) => {
  // Query to insert a land summary into the database
  const insertWaterUsageSummaryByMonthQuery = `
    INSERT INTO water_usage_summary_by_month (${waterUsageSummaryByMonthFields.join(
      ", "
    )})
    VALUES (${waterUsageSummaryByMonthFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = waterUsageSummaryByMonthFields.map(
    (waterUsageSummaryByMonthField) => {
      return waterUsageSummaryByMonth[waterUsageSummaryByMonthField];
    }
  );

  // Execute the insert query with the prepared values
  connectionDB.query(insertWaterUsageSummaryByMonthQuery, values, (err) => {
    if (err) {
      console.error("Insert WaterUsageSummaryByMonth error:", err);
    }
  });
};

module.exports = {
  insertWaterUsageSummaryByCrop,
  insertWaterUsageSummaryByMonth,
};
