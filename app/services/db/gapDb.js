// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ✅ ADD: Same getBangkokTime function as other modules
/**
 * Get Bangkok timezone timestamp as MySQL-compatible string
 */
const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Bangkok",
    })
    .replace(" ", "T");
};

/**
 * Get all existing land_ids from durian_gardens table for validation
 */
async function getValidLandIds() {
  try {
    const [result] = await connectionDB
      .promise()
      .query("SELECT land_id FROM durian_gardens");
    return new Set(result.map((row) => row.land_id));
  } catch (error) {
    console.error("Error getting valid land_ids:", error);
    return new Set();
  }
}

/**
 * Bulk insert or update GAP certificates using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} gapCertificates - Array of GAP certificate objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateGap(gapCertificates) {
  if (!gapCertificates || gapCertificates.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    console.time("Land validation");

    // Get all valid land_ids from durian_gardens table
    const validLandIds = await getValidLandIds();

    console.timeEnd("Land validation");
    console.time("Data preparation");

    // ✅ ADD: Get Bangkok time (same as other modules)
    const bangkokTime = getBangkokTime();

    // Filter GAP certificates with valid land_ids and prepare data
    const validGapCertificates = [];
    const skippedGapCertificates = [];

    for (const gap of gapCertificates) {
      // Skip if gapCertNumber is empty (no GAP certificate)
      if (!gap.gapCertNumber || gap.gapCertNumber.trim() === "") {
        skippedGapCertificates.push({
          landId: gap.landId,
          reason: "empty_gap_cert_number",
        });
        continue;
      }

      // Validate if land_id exists in durian_gardens table
      if (!validLandIds.has(gap.landId)) {
        skippedGapCertificates.push({
          landId: gap.landId,
          reason: "missing_land_reference",
        });
        continue;
      }

      // Only map the fields that exist in the table
      validGapCertificates.push([
        gap.gapCertNumber,
        gap.gapCertType || null,
        gap.gapIssuedDate || null,
        gap.gapExpiryDate || null,
        gap.farmerId,
        gap.landId,
        gap.cropId,
        bangkokTime, // ✅ CHANGED: Use bangkokTime instead of new Date()
      ]);
    }

    console.log(
      `📊 Validation: ${validGapCertificates.length} valid, ${skippedGapCertificates.length} skipped GAP certificates`
    );

    if (validGapCertificates.length === 0) {
      console.log("⚠️  No valid GAP certificates to process");
      console.timeEnd("Data preparation");
      return {
        inserted: 0,
        updated: 0,
        errors: 0,
        skipped: skippedGapCertificates.length,
      };
    }

    console.timeEnd("Data preparation");
    console.time("Bulk database operation");

    // Get count before operation
    const [countBefore] = await connection.query(
      "SELECT COUNT(*) as count FROM gap"
    );
    const beforeCount = countBefore[0].count;

    // ✅ CHANGED: Use VALUES(fetch_at) pattern like other modules
    const sql = `
      INSERT INTO gap (
        gap_cert_number, gap_cert_type, gap_issued_date, gap_expiry_date,
        farmer_id, land_id, crop_id, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        gap_cert_type = VALUES(gap_cert_type),
        gap_issued_date = VALUES(gap_issued_date),
        gap_expiry_date = VALUES(gap_expiry_date),
        farmer_id = VALUES(farmer_id),
        land_id = VALUES(land_id),
        crop_id = VALUES(crop_id),
        fetch_at = VALUES(fetch_at)  -- ✅ CHANGED: Use VALUES(fetch_at) like other modules
    `;

    // ✅ CHANGED: Use validGapCertificates directly (bangkokTime already in array)
    const [result] = await connection.query(sql, [validGapCertificates]);

    console.timeEnd("Bulk database operation");

    // Get count after operation
    const [countAfter] = await connection.query(
      "SELECT COUNT(*) as count FROM gap"
    );
    const afterCount = countAfter[0].count;

    const actualInserts = afterCount - beforeCount;
    const actualUpdates = validGapCertificates.length - actualInserts;

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated`
    );

    return {
      inserted: actualInserts,
      updated: actualUpdates,
      errors: 0,
      skipped: skippedGapCertificates.length,
      totalProcessed: gapCertificates.length,
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error("❌ Bulk GAP insert/update error:", error);
    return {
      inserted: 0,
      updated: 0,
      errors: gapCertificates.length,
      skipped: 0,
      totalProcessed: gapCertificates.length,
      error: error.message,
    };
  }
}

// Export the validation function as well
export { getValidLandIds };
