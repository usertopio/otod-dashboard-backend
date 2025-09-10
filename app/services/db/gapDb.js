// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

/**
 * Bulk ensure reference codes for a list of names
 */
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names || names.length === 0) {
    return new Map();
  }

  try {
    // Get existing codes
    const placeholders = names.map(() => "?").join(",");
    const selectQuery = `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (${placeholders})`;
    const [existing] = await connectionDB.promise().query(selectQuery, names);

    const codeMap = new Map();
    const existingNames = new Set();

    existing.forEach((row) => {
      codeMap.set(row[nameColumn], row[codeColumn]);
      existingNames.add(row[nameColumn]);
    });

    // Find missing names
    const missingNames = names.filter((name) => !existingNames.has(name));

    if (missingNames.length > 0) {
      // Get next available code number
      const maxQuery = `SELECT MAX(CAST(SUBSTRING(${codeColumn}, ${
        prefix.length + 1
      }) AS UNSIGNED)) as maxNum FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%'`;
      const [maxResult] = await connectionDB.promise().query(maxQuery);
      let nextNum = (maxResult[0]?.maxNum || 0) + 1;

      // Insert missing codes
      const insertData = missingNames.map((name) => {
        const newCode = `${prefix}${nextNum.toString().padStart(3, "0")}`;
        codeMap.set(name, newCode);
        nextNum++;
        return [newCode, name];
      });

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
}

/**
 * Get all existing land_ids from durian_gardens table for validation
 */
async function getValidLandIds() {
  try {
    const [rows] = await connectionDB
      .promise()
      .query("SELECT DISTINCT land_id FROM durian_gardens");
    return new Set(rows.map((row) => row.land_id));
  } catch (err) {
    console.error("Error fetching valid land IDs:", err);
    return new Set();
  }
}

/**
 * Bulk process reference codes for all GAP certificates at once
 */
async function bulkProcessReferenceCodes(gapCertificates) {
  // Get unique values
  const provinces = [
    ...new Set(gapCertificates.map((g) => g.province).filter(Boolean)),
  ];
  const districts = [
    ...new Set(gapCertificates.map((g) => g.district).filter(Boolean)),
  ];
  const subdistricts = [
    ...new Set(gapCertificates.map((g) => g.subdistrict).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, districtCodes, subdistrictCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinces,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_districts",
      "district_name_th",
      "district_code",
      districts,
      "GDIST"
    ),
    bulkEnsureRefCodes(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      subdistricts,
      "GSUBDIST"
    ),
  ]);

  return { provinceCodes, districtCodes, subdistrictCodes };
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

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes } =
      await bulkProcessReferenceCodes(gapCertificates);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Land validation");

    // Get all valid land_ids from durian_gardens table
    const validLandIds = await getValidLandIds();

    console.timeEnd("⏱️ Land validation");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM gap");
    const beforeCount = countBefore[0].count;

    // Filter GAP certificates with valid land_ids and prepare data
    const validGapCertificates = [];
    const skippedGapCertificates = [];

    for (const gap of gapCertificates) {
      // ✅ VALIDATE: Check if land_id exists in durian_gardens table
      if (!validLandIds.has(gap.landId)) {
        skippedGapCertificates.push({
          recId: gap.recId,
          landId: gap.landId,
          reason: "missing_land_reference",
        });
        continue;
      }

      // Get reference codes
      const provinceCode = provinceCodes.get(gap.province) || null;
      const districtCode = districtCodes.get(gap.district) || null;
      const subdistrictCode = subdistrictCodes.get(gap.subdistrict) || null;

      if (!provinceCode || !districtCode || !subdistrictCode) {
        skippedGapCertificates.push({
          recId: gap.recId,
          landId: gap.landId,
          reason: "missing_location_codes",
        });
        continue;
      }

      validGapCertificates.push([
        gap.recId, // rec_id
        provinceCode, // gap_province_code
        districtCode, // gap_district_code
        subdistrictCode, // gap_subdistrict_code
        gap.landId, // land_id
        gap.gapId, // gap_id
        gap.issuedDate, // issued_date
        gap.expiredDate, // expired_date
        gap.createdTime, // created_at
        gap.updatedTime, // updated_at
        gap.companyId, // company_id
        new Date(), // fetch_at
      ]);
    }

    console.log(
      `📊 Validation: ${validGapCertificates.length} valid, ${skippedGapCertificates.length} skipped GAP certificates`
    );

    if (skippedGapCertificates.length > 0) {
      console.warn(
        `⚠️  Skipped ${skippedGapCertificates.length} GAP certificates with missing references`
      );
      // Log first few examples
      skippedGapCertificates.slice(0, 5).forEach((skip) => {
        console.warn(
          `   - GAP ${skip.recId}: ${skip.reason} (land_id: '${skip.landId}')`
        );
      });
    }

    let actualInserts = 0;
    let actualUpdates = 0;

    if (validGapCertificates.length > 0) {
      console.timeEnd("⏱️ Data preparation");
      console.time("⏱️ Bulk database operation");

      // Execute bulk insert with ON DUPLICATE KEY UPDATE
      const query = `
        INSERT INTO gap (
          rec_id, gap_province_code, gap_district_code, gap_subdistrict_code,
          land_id, gap_id, issued_date, expired_date,
          created_at, updated_at, company_id, fetch_at
        ) VALUES ? 
        ON DUPLICATE KEY UPDATE
          gap_province_code = VALUES(gap_province_code),
          gap_district_code = VALUES(gap_district_code),
          gap_subdistrict_code = VALUES(gap_subdistrict_code),
          land_id = VALUES(land_id),
          gap_id = VALUES(gap_id),
          issued_date = VALUES(issued_date),
          expired_date = VALUES(expired_date),
          updated_at = VALUES(updated_at),
          company_id = VALUES(company_id),
          fetch_at = VALUES(fetch_at)
      `;

      const [result] = await connectionDB
        .promise()
        .query(query, [validGapCertificates]);

      console.timeEnd("⏱️ Bulk database operation");

      // Get count after operation
      const [countAfter] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as count FROM gap");
      const afterCount = countAfter[0].count;

      actualInserts = afterCount - beforeCount;
      actualUpdates = validGapCertificates.length - actualInserts;
    } else {
      console.timeEnd("⏱️ Data preparation");
      console.log(
        "⚠️  No valid GAP certificates to process - all skipped due to missing references"
      );
    }

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated, ${skippedGapCertificates.length} skipped`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${beforeCount + actualInserts} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      skipped: skippedGapCertificates.length,
      totalProcessed: gapCertificates.length,
      skippedDetails: skippedGapCertificates.slice(0, 10), // First 10 for debugging
    };
  } catch (err) {
    console.error("Bulk GAP insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: gapCertificates.length,
      skipped: 0,
      error: err.message,
    };
  }
}
