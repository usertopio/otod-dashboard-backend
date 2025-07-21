const {
  connectionDB,
  aNewFields,
  newsSummaryByMonthFields,
} = require("../../config/db/news.conf.js");

// Function to insert a new into the database, one by one
const insertANew = (aNew) => {
  // Query to insert a new into the database
  const insertANewQuery = `
          INSERT INTO news (${aNewFields.join(", ")})
          VALUES (${aNewFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted, handling empty date fields
  // by inserting null instead of an empty string
  const values = aNewFields.map((aNewField) => {
    return aNew[aNewField] || null;
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertANewQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

// Function to insert a news summary into the database, one by one
const insertNewsSummaryByMonth = (newsSummaryByMonth) => {
  // ...existing code...
  const insertNewsSummaryQuery = `
    INSERT INTO news_summary_by_month (${newsSummaryByMonthFields.join(", ")})
    VALUES (${newsSummaryByMonthFields.map(() => "?").join(", ")})
  `;
  const values = newsSummaryByMonthFields.map((newsSummaryByMonthField) => {
    return newsSummaryByMonth[newsSummaryByMonthField];
  });
  connectionDB.query(insertNewsSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert NewsSummaryByMonth error:", err);
    }
  });
};

module.exports = {
  insertANew,
  insertNewsSummaryByMonth,
};
