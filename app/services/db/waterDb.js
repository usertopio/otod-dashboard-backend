const {
  connectionDB,
  waterUsageSummaryByMonthFields,
} = require("../../config/db/water.conf.js");

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
  insertWaterUsageSummaryByMonth,
};
