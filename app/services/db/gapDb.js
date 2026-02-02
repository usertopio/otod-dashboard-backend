// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

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
    console.time("Data preparation");

    //  Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare all GAP certificates for insertion (no validation)
    const validGapCertificates = [];

    for (const gap of gapCertificates) {
      // Skip if gapCertNumber is empty (no GAP certificate)
      if (!gap.gapCertNumber || gap.gapCertNumber.trim() === "") {
        continue;
      }

      // Only map the fields that exist in the table (allow NULL for land_id)
      validGapCertificates.push([
        gap.gapCertNumber,
        gap.gapCertType || null,
        gap.gapIssuedDate || null,
        gap.gapExpiryDate || null,
        gap.farmerId || null,
        gap.landId || null,
        gap.cropId || null,
        bangkokTime,
      ]);
    }

    if (validGapCertificates.length === 0) {
      console.log("⚠️  No GAP certificates to process");
      console.timeEnd("Data preparation");
      return {
        inserted: 0,
        updated: 0,
        errors: 0,
        skipped: 0,
      };
    }

    console.timeEnd("Data preparation");
    console.time("Bulk database operation");

    // Get count before operation
    const [countBefore] = await connection.query(
      "SELECT COUNT(*) as count FROM gap"
    );
    const beforeCount = countBefore[0].count;

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
        fetch_at = VALUES(fetch_at)
    `;

    // Use validGapCertificates directly
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
      skipped: 0,
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
