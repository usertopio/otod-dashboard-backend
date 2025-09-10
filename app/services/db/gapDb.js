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

  const connection = connectionDB.promise();

  try {
    console.time("Land validation");

    // Get all valid land_ids from durian_gardens table
    const validLandIds = await getValidLandIds();

    console.timeEnd("Land validation");
    console.time("Data preparation");

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

      // ✅ SIMPLE MAPPING: Only map the fields that exist in the table
      validGapCertificates.push([
        gap.gapCertNumber, // gap_cert_number (required)
        gap.gapCertType || null, // gap_cert_type (optional)
        gap.gapIssuedDate || null, // gap_issued_date (optional)
        gap.gapExpiryDate || null, // gap_expiry_date (optional)
        gap.farmerId, // farmer_id (required)
        gap.landId, // land_id (required)
        new Date(), // fetch_at (timestamp)
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

    // ✅ SIMPLE SQL: No reference codes needed
    const sql = `
      INSERT INTO gap (
        gap_cert_number, gap_cert_type, gap_issued_date, gap_expiry_date,
        farmer_id, land_id, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        gap_cert_type = VALUES(gap_cert_type),
        gap_issued_date = VALUES(gap_issued_date),
        gap_expiry_date = VALUES(gap_expiry_date),
        farmer_id = VALUES(farmer_id),
        land_id = VALUES(land_id),
        fetch_at = NOW()
    `;

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
