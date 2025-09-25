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

// ===================== DB Utilities =====================

/**
 * Bulk insert or update merchants using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} merchants - Array of merchant objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateMerchants(merchants) {
  if (!merchants || merchants.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes } =
      await bulkProcessReferenceCodes(merchants);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM merchants");
    const beforeCount = countBefore[0].count;

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare merchant data
    const merchantData = merchants.map((merchant) => [
      merchant.recId,
      merchant.merchantName,
      provinceCodes.get(merchant.province) || null,
      districtCodes.get(merchant.district) || null,
      subdistrictCodes.get(merchant.subdistrict) || null,
      merchant.lat,
      merchant.lon,
      merchant.createdTime,
      merchant.updatedTime,
      merchant.companyId,
      merchant.companyName,
      bangkokTime,
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    const insertQuery = `
      INSERT INTO merchants (
        rec_id, merchant_name, province_code, district_code, subdistrict_code,
        lat, lon, created_time, updated_time, company_id, company_name, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        merchant_name = VALUES(merchant_name),
        province_code = VALUES(province_code),
        district_code = VALUES(district_code),
        subdistrict_code = VALUES(subdistrict_code),
        lat = VALUES(lat),
        lon = VALUES(lon),
        created_time = VALUES(created_time),
        updated_time = VALUES(updated_time),
        company_id = VALUES(company_id),
        company_name = VALUES(company_name),
        fetch_at = VALUES(fetch_at)
    `;

    // Use merchantData directly
    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [merchantData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM merchants");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = merchants.length - actualInserts;

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${afterCount} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      totalProcessed: merchants.length,
    };
  } catch (err) {
    console.error("Bulk merchant insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: merchants.length,
      totalProcessed: merchants.length,
    };
  }
}
