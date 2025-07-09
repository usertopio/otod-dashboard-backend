const {
  connectionDB,
  substanceUsageSummaryByCropFields,
  substanceUsageSummaryByMonthFields,
} = require("../../config/db/substance.conf.js");

// Function to insert a land into the database, one by one
const insertSubstanceUsageSummaryByCrop = (substanceUsageSummaryByCrop) => {
  // Query to insert a land into the database
  const insertSubstanceUsageSummaryByCropQuery = `
          INSERT INTO substance_usage_summary_by_crop (${substanceUsageSummaryByCropFields.join(
            ", "
          )})
          VALUES (${substanceUsageSummaryByCropFields
            .map(() => "?")
            .join(", ")})`;

  // Prepare the values to be inserted
  const values = substanceUsageSummaryByCropFields.map(
    (substanceUsageSummaryByCropField) => {
      return substanceUsageSummaryByCrop[substanceUsageSummaryByCropField];
    }
  );

  // Execute the insert query with the prepared values
  connectionDB.query(insertSubstanceUsageSummaryByCropQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

// Function to insert a land summary into the database, one by one
const insertSubstanceUsageSummaryByMonth = (substanceUsageSummaryByMonth) => {
  // Query to insert a land summary into the database
  const insertSubstanceUsageSummaryByMonthQuery = `
    INSERT INTO substance_usage_summary_by_month (${substanceUsageSummaryByMonthFields.join(
      ", "
    )})
    VALUES (${substanceUsageSummaryByMonthFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = substanceUsageSummaryByMonthFields.map(
    (substanceUsageSummaryByMonthField) => {
      return substanceUsageSummaryByMonth[substanceUsageSummaryByMonthField];
    }
  );

  // Execute the insert query with the prepared values
  connectionDB.query(insertSubstanceUsageSummaryByMonthQuery, values, (err) => {
    if (err) {
      console.error("Insert SubstanceUsageSummaryByMonth error:", err);
    }
  });
};

module.exports = {
  insertSubstanceUsageSummaryByCrop,
  insertSubstanceUsageSummaryByMonth,
};
