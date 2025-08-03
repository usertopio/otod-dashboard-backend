const { insertOrUpdateFarmer } = require("../services/db/farmersDb");
const { getFarmers } = require("../services/api/farmers");
const { connectionDB } = require("../config/db/db.conf.js");

// Controller function to fetch from API and save into DB
async function fetchFarmers(req, res) {
  try {
    // Add safety check for req.body
    const resetTable = (req.body && req.body.resetTable) || false;

    console.log("🔄 Reset table requested:", resetTable);

    if (resetTable) {
      console.log("🗑️ Resetting farmers table...");
      await resetFarmersTable();
    }

    // Detail provided by the outsource
    let totalRecords = 1114;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays and counters
    let allFarmersAllPages = [];
    let allFarmersCurPage = [];

    // === ADD OPERATION COUNTERS ===
    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let processedRecIds = new Set(); // Track which rec_ids we processed
    let newRecIds = []; // Track new rec_ids that were inserted
    let updatedRecIds = []; // Track rec_ids that were updated
    let errorRecIds = []; // Track rec_ids that had errors

    // === GET DATABASE COUNTS ===
    // Get count before processing
    const [dbBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    const dbCountBefore = dbBefore[0].total;

    // Loop through the number of pages to fetch all farmer data
    for (let page = 1; page <= pages; page++) {
      // Prepare the request body for the API request
      let requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: 500,
      };

      // Custom headers for the API request
      let customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch farmers data in the current page from the outsource API
      let farmers = await getFarmers(requestBody, customHeaders);
      allFarmersCurPage = farmers.data;

      // Concatenate the fetched farmers from pages
      allFarmersAllPages = allFarmersAllPages.concat(allFarmersCurPage);

      // Log: Log the first 5 recId for the current page
      console.log(
        `📄 Page ${page}: First 5 recId: [${allFarmersCurPage
          .slice(0, 5)
          .map((f) => f.recId)
          .join(", ")}]`
      );

      // Log: Log the fetched data for each page
      console.log(
        `📄 Page ${page}: Length: ${
          allFarmersCurPage.length
        }, Type: ${typeof allFarmersCurPage}`
      );
    }

    // === PROCESS FARMERS AND TRACK OPERATIONS ===
    // Remove duplicates first (process unique farmers only)
    const uniqueFarmers = allFarmersAllPages.filter(
      (farmer, index, self) =>
        index === self.findIndex((f) => f.recId === farmer.recId)
    );

    console.log(
      `📊 Total from API: ${allFarmersAllPages.length}, Unique: ${uniqueFarmers.length}`
    );

    // Now process only unique farmers
    for (const farmer of uniqueFarmers) {
      const result = await insertOrUpdateFarmer(farmer);

      // Count operations and track specific rec_ids
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

      // Track processed rec_ids
      processedRecIds.add(farmer.recId);
    }

    // Get count after processing
    const [dbAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    const dbCountAfter = dbAfter[0].total;

    // === CALCULATE METRICS ===
    const totalFromAPI = allFarmersAllPages.length;
    const uniqueFromAPI = processedRecIds.size;
    const newRecordsAmount = insertCount;
    const duplicatedDataAmount = totalFromAPI - uniqueFromAPI;

    // === LOG NEW METRICS STRUCTURE ===
    console.log("\n📊 === API METRICS ===");
    console.log(`📥 Record amount from current API call: ${totalFromAPI}`);
    console.log(`🔍 Unique records from current API call: ${uniqueFromAPI}`);
    console.log(`🆕 New records amount: ${newRecordsAmount}`);
    console.log(`🔄 Duplicated data amount: ${duplicatedDataAmount}`);

    console.log("\n📊 === DATABASE METRICS ===");
    console.log(`📊 Previous amount records in table: ${dbCountBefore}`);
    console.log(`📈 Current amount records in table: ${dbCountAfter}`);
    console.log(`➕ Records INSERTED: ${insertCount}`);
    console.log(`🔄 Records UPDATED: ${updateCount}`);
    console.log(`❌ Records with ERRORS: ${errorCount}`);

    // === ADDITIONAL USEFUL METRICS ===
    console.log("\n📊 === ADDITIONAL INSIGHTS ===");
    console.log(
      `📋 Total processing operations: ${
        insertCount + updateCount + errorCount
      }`
    );
    const recordsInDbNotInAPI = dbCountBefore - updateCount;
    console.log(
      `📍 Records in DB but not in current API: ${recordsInDbNotInAPI}`
    );
    console.log(`⏱️ Database growth: ${dbCountAfter - dbCountBefore} records`);

    // === LOG NEW REC_IDS ===
    if (newRecIds.length > 0) {
      console.log(`\n🆕 NEW REC_IDS INSERTED (${newRecIds.length}):`);
      if (newRecIds.length <= 20) {
        console.log(`   [${newRecIds.join(", ")}]`);
      } else {
        console.log(`   First 10: [${newRecIds.slice(0, 10).join(", ")}]`);
        console.log(`   Last 10:  [${newRecIds.slice(-10).join(", ")}]`);
        console.log(`   (... ${newRecIds.length - 20} more rec_ids ...)`);
      }
    } else {
      console.log(`\n🆕 NEW REC_IDS INSERTED: None`);
    }

    // === LOG ERROR REC_IDS (if any) ===
    if (errorRecIds.length > 0) {
      console.log(`\n❌ ERROR REC_IDS (${errorRecIds.length}):`);
      console.log(`   [${errorRecIds.slice(0, 10).join(", ")}]`);
    }

    console.log("==========================================\n");

    // ✅ Updated Success response
    return res.status(200).json({
      message: "Farmers fetched and saved successfully",
      apiMetrics: {
        totalFromAPI: totalFromAPI,
        uniqueFromAPI: uniqueFromAPI,
        newRecordsAmount: newRecordsAmount,
        duplicatedDataAmount: duplicatedDataAmount,
      },
      databaseMetrics: {
        previousCount: dbCountBefore,
        currentCount: dbCountAfter,
        inserted: insertCount,
        updated: updateCount,
        errors: errorCount,
        growth: dbCountAfter - dbCountBefore,
      },
      additionalInsights: {
        totalProcessingOperations: insertCount + updateCount + errorCount,
        recordsInDbNotInAPI: recordsInDbNotInAPI,
        newRecIds: newRecIds,
        errorRecIds: errorRecIds,
      },
      allFarmersAllPages: allFarmersAllPages,
    });
  } catch (err) {
    console.error("Error in fetchFarmers:", err);
    return res.status(500).json({ message: "Failed to fetch or save farmers" });
  }
}

// Add new function for looping until target is reached
async function fetchFarmersUntilTarget(req, res) {
  try {
    const targetCount = (req.body && req.body.targetCount) || 1114;
    const maxAttempts = (req.body && req.body.maxAttempts) || 10;
    const resetBeforeStart = (req.body && req.body.resetTable) || false;

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0; // Track actual API calls made

    console.log(
      `🎯 Target: ${targetCount} farmers, Max attempts: ${maxAttempts}`
    );

    // Reset table if requested
    if (resetBeforeStart) {
      console.log("🗑️ Resetting farmers table before starting...");
      await resetFarmersTable();
    }

    // 🆕 SIMPLIFIED: Always execute until target is reached
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

      // 🆕 ALWAYS make API call - no target checking
      attemptsUsed++; // Count this as an actual attempt

      // Call the helper function
      const result = await performSingleFetch();

      console.log(`📈 Attempt ${attempt} completed:`);
      console.log(`   ➕ Inserted: ${result.inserted}`);
      console.log(`   🔄 Updated: ${result.updated}`);
      console.log(`   📊 Total now: ${result.totalAfter}`);

      currentCount = result.totalAfter;
      attempt++;

      // 🆕 ONLY stop when target is reached (no force mode needed)
      if (currentCount >= targetCount) {
        console.log(
          `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts`
        );
        break;
      }
    }

    // Final status
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
    });
  } catch (err) {
    console.error("Error in fetchFarmersUntilTarget:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch farmers until target" });
  }
}

// Extract existing fetch logic to helper function
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

  // Get count before processing
  const [dbBefore] = await connectionDB
    .promise()
    .query("SELECT COUNT(*) as total FROM farmers");
  const dbCountBefore = dbBefore[0].total;

  // API fetching logic
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

  // Process farmers
  for (const farmer of uniqueFarmers) {
    const result = await insertOrUpdateFarmer(farmer);

    if (result.operation === "INSERT") {
      insertCount++;
      newRecIds.push(farmer.recId);
    } else if (result.operation === "UPDATE") {
      updateCount++;
    } else if (result.operation === "ERROR") {
      errorCount++;
    }

    processedRecIds.add(farmer.recId);
  }

  // Get count after processing
  const [dbAfter] = await connectionDB
    .promise()
    .query("SELECT COUNT(*) as total FROM farmers");
  const dbCountAfter = dbAfter[0].total;

  return {
    inserted: insertCount,
    updated: updateCount,
    errors: errorCount,
    totalBefore: dbCountBefore,
    totalAfter: dbCountAfter,
    newRecIds: newRecIds,
    uniqueFromAPI: uniqueFarmers.length,
  };
}

// Reset function for farmers table (TRUNCATE)
async function resetFarmersTable() {
  try {
    // Check count before reset
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    console.log(`🔍 Records before reset: ${countBefore[0].total}`);

    // Check current AUTO_INCREMENT value
    const [autoIncBefore] = await connectionDB
      .promise()
      .query("SHOW TABLE STATUS LIKE 'farmers'");
    console.log(
      `🔍 AUTO_INCREMENT before reset: ${autoIncBefore[0].Auto_increment}`
    );

    // Force reset with multiple methods
    await connectionDB.promise().query("SET FOREIGN_KEY_CHECKS = 0");
    await connectionDB.promise().query("TRUNCATE TABLE farmers");
    await connectionDB.promise().query("SET FOREIGN_KEY_CHECKS = 1");
    await connectionDB
      .promise()
      .query("ALTER TABLE farmers AUTO_INCREMENT = 1");

    console.log("🗑️ TRUNCATE command executed");

    // Check count after reset
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    console.log(`✅ Records after reset: ${countAfter[0].total}`);

    // Check AUTO_INCREMENT after reset
    const [autoIncAfter] = await connectionDB
      .promise()
      .query("SHOW TABLE STATUS LIKE 'farmers'");
    console.log(
      `✅ AUTO_INCREMENT after reset: ${autoIncAfter[0].Auto_increment}`
    );

    console.log("🗑️ Farmers table truncated and AUTO_INCREMENT reset to 1");
  } catch (err) {
    console.error("Error resetting farmers table:", err);
    throw err;
  }
}

module.exports = { fetchFarmers, fetchFarmersUntilTarget, resetFarmersTable };
