const {
  connectionDB,
  communitiesFields,
  communitySummaryFields,
} = require("../../config/db/communities.conf.js");

// Function to insert a land into the database, one by one

const insertCommunities = (community) => {
  // Query to insert a land into the database
  const insertCommunitiesQuery = `
          INSERT INTO communities (${communitiesFields.join(", ")})
          VALUES (${communitiesFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = communitiesFields.map((communitiesField) => {
    return community[communitiesField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCommunitiesQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

const insertCommunitySummary = (communitySummary) => {
  // Query to insert a land into the database
  const insertCommunitySummaryQuery = `
          INSERT INTO community_summary (${communitySummaryFields.join(", ")})
          VALUES (${communitySummaryFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = communitySummaryFields.map((communitySummaryField) => {
    return communitySummary[communitySummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCommunitySummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = { insertCommunities, insertCommunitySummary };
