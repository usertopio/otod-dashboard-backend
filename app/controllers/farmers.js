const { insertOrUpdateFarmer } = require("../services/db/farmersDb");
const { getFarmers } = require("../services/api/farmers");
const { connectionDB } = require("../config/db/db.conf.js");

// Main function for fetching farmers until target is reached
async function fetchFarmersUntilTarget(req, res) {
  try {
    const targetCount = (req.body && req.body.targetCount) || 1114;
    const maxAttempts = (req.body && req.body.maxAttempts) || 10;

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0; // Track actual API calls made

    console.log(
      `🎯 Target: ${targetCount} farmers, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);

      // Get current count before this attempt
      const [dbBefore] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as total FROM farmers");
      currentCount = dbBefore[0].total;

      console.log(`📊 Current farmers in DB: ${currentCount}/${targetCount}`);

      if (currentCount < targetCount) {
        console.log(
          `📊 Need ${targetCount - currentCount} more farmers - calling API...`
        );
      } else {
        console.log(
          `🔄 Target reached but continuing API call for fresh data...`
        );
      }

      // Always make API call
      attemptsUsed++; // Count this as an actual attempt

      // Call the helper function to fetch and process data
      const result = await performSingleFetch();

      // Log detailed metrics for this attempt
      logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        console.log(
          `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts`
        );
        break;
      }
    }

    // Final status and response
    const [finalCount] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");

    const status =
      finalCount[0].total >= targetCount ? "SUCCESS" : "INCOMPLETE";

    console.log(`\n🏁 === FINAL RESULT ===`);
    console.log(`🎯 Target: ${targetCount}`);
    console.log(`📊 Achieved: ${finalCount[0].total}`);
    console.log(`🔄 Attempts used: ${attemptsUsed}/${maxAttempts}`);
    console.log(`✅ Status: ${status}`);

    return res.status(200).json({
      message: `Fetch loop completed - ${status}`,
      target: targetCount,
      achieved: finalCount[0].total,
      attemptsUsed: attemptsUsed,
      maxAttempts: maxAttempts,
      status: status,
      reachedTarget: finalCount[0].total >= targetCount,
    });
  } catch (err) {
    console.error("Error in fetchFarmersUntilTarget:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch farmers until target" });
  }
}

// Helper function to perform a single fetch operation
async function performSingleFetch() {
  let totalRecords = 1114;
  let pageSize = 500;
  let pages = Math.ceil(totalRecords / pageSize);

  let allFarmersAllPages = [];
  let insertCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let processedRecIds = new Set();
  let newRecIds = [];
  let updatedRecIds = [];
  let errorRecIds = [];

  // Get count before processing
  const [dbBefore] = await connectionDB
    .promise()
    .query("SELECT COUNT(*) as total FROM farmers");
  const dbCountBefore = dbBefore[0].total;

  // Fetch data from all pages
  for (let page = 1; page <= pages; page++) {
    let requestBody = {
      provinceName: "",
      pageIndex: page,
      pageSize: 500,
    };

    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    let farmers = await getFarmers(requestBody, customHeaders);
    let allFarmersCurPage = farmers.data;
    allFarmersAllPages = allFarmersAllPages.concat(allFarmersCurPage);

    console.log(
      `📄 Page ${page}: First 5 recId: [${allFarmersCurPage
        .slice(0, 5)
        .map((f) => f.recId)
        .join(", ")}]`
    );
    console.log(`📄 Page ${page}: Length: ${allFarmersCurPage.length}`);
  }

  // Process unique farmers only
  const uniqueFarmers = allFarmersAllPages.filter(
    (farmer, index, self) =>
      index === self.findIndex((f) => f.recId === farmer.recId)
  );

  console.log(
    `📊 Total from API: ${allFarmersAllPages.length}, Unique: ${uniqueFarmers.length}`
  );

  // Process each unique farmer
  for (const farmer of uniqueFarmers) {
    const result = await insertOrUpdateFarmer(farmer);

    if (result.operation === "INSERT") {
      insertCount++;
      newRecIds.push(farmer.recId);
    } else if (result.operation === "UPDATE") {
      updateCount++;
      updatedRecIds.push(farmer.recId);
    } else if (result.operation === "ERROR") {
      errorCount++;
      errorRecIds.push(farmer.recId);
    }

    processedRecIds.add(farmer.recId);
  }

  // Get count after processing
  const [dbAfter] = await connectionDB
    .promise()
    .query("SELECT COUNT(*) as total FROM farmers");
  const dbCountAfter = dbAfter[0].total;

  return {
    // Database metrics
    totalBefore: dbCountBefore,
    totalAfter: dbCountAfter,
    inserted: insertCount,
    updated: updateCount,
    errors: errorCount,
    growth: dbCountAfter - dbCountBefore,

    // API metrics
    totalFromAPI: allFarmersAllPages.length,
    uniqueFromAPI: uniqueFarmers.length,
    duplicatedDataAmount: allFarmersAllPages.length - uniqueFarmers.length,

    // Record tracking
    newRecIds: newRecIds,
    updatedRecIds: updatedRecIds,
    errorRecIds: errorRecIds,
    processedRecIds: Array.from(processedRecIds),

    // Additional insights
    recordsInDbNotInAPI: dbCountBefore - updateCount,
    totalProcessingOperations: insertCount + updateCount + errorCount,

    // For compatibility with existing logs
    allFarmersAllPages: allFarmersAllPages,
  };
}

// Helper function to log attempt results (enhanced version of original metrics)
function logAttemptResults(attempt, result) {
  console.log(`📈 Attempt ${attempt} completed:`);
  console.log(`   ➕ Inserted: ${result.inserted}`);
  console.log(`   🔄 Updated: ${result.updated}`);
  console.log(`   ❌ Errors: ${result.errors}`);
  console.log(`   📊 Total now: ${result.totalAfter}`);

  // === LOG ENHANCED METRICS (from original fetchFarmers) ===
  console.log("\n📊 === API METRICS ===");
  console.log(`📥 Record amount from current API call: ${result.totalFromAPI}`);
  console.log(
    `🔍 Unique records from current API call: ${result.uniqueFromAPI}`
  );
  console.log(`🆕 New records amount: ${result.inserted}`);
  console.log(`🔄 Duplicated data amount: ${result.duplicatedDataAmount}`);

  console.log("\n📊 === DATABASE METRICS ===");
  console.log(`📊 Previous amount records in table: ${result.totalBefore}`);
  console.log(`📈 Current amount records in table: ${result.totalAfter}`);
  console.log(`➕ Records INSERTED: ${result.inserted}`);
  console.log(`🔄 Records UPDATED: ${result.updated}`);
  console.log(`❌ Records with ERRORS: ${result.errors}`);

  console.log("\n📊 === ADDITIONAL INSIGHTS ===");
  console.log(
    `📋 Total processing operations: ${result.totalProcessingOperations}`
  );
  console.log(
    `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
  );
  console.log(`⏱️ Database growth: ${result.growth} records`);

  // === LOG NEW REC_IDS ===
  if (result.newRecIds.length > 0) {
    console.log(`\n🆕 NEW REC_IDS INSERTED (${result.newRecIds.length}):`);
    if (result.newRecIds.length <= 20) {
      console.log(`   [${result.newRecIds.join(", ")}]`);
    } else {
      console.log(`   First 10: [${result.newRecIds.slice(0, 10).join(", ")}]`);
      console.log(`   Last 10:  [${result.newRecIds.slice(-10).join(", ")}]`);
      console.log(`   (... ${result.newRecIds.length - 20} more rec_ids ...)`);
    }
  } else {
    console.log(`\n🆕 NEW REC_IDS INSERTED: None`);
  }

  // === LOG ERROR REC_IDS (if any) ===
  if (result.errorRecIds.length > 0) {
    console.log(`\n❌ ERROR REC_IDS (${result.errorRecIds.length}):`);
    console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
  }

  console.log("==========================================\n");
}

// Export only the main function
module.exports = {
  fetchFarmersUntilTarget,
};
