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
// Provides helper functions for reference code lookup and upserting durian gardens

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
  if (!names.length) return {};

  // Get existing codes in one query
  const [existing] = await connectionDB
    .promise()
    .query(
      `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
      [names]
    );

  const codeMap = {};
  existing.forEach((row) => {
    codeMap[row[nameColumn]] = row[codeColumn];
  });

  // Find missing names
  const missingNames = names.filter((name) => !codeMap[name]);

  if (missingNames.length > 0) {
    // Generate codes for missing names
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let nextNumber = 1;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      nextNumber = parseInt(lastCode.replace(prefix, "")) + 1;
    }

    // Bulk insert missing codes
    const insertData = missingNames.map((name, index) => {
      const code = `${prefix}${String(nextNumber + index).padStart(3, "0")}`;
      codeMap[name] = code;
      return [code, name, "generated"];
    });

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`,
        [insertData]
      );

    console.log(`🆕 Created ${insertData.length} new ${table} codes`);
  }

  return codeMap;
}

/**
 * Bulk process reference codes for durian gardens at once
 */
export async function bulkProcessReferenceCodes(gardens) {
  // Get unique values
  const provinces = [
    ...new Set(gardens.map((g) => g.province).filter(Boolean)),
  ];
  const districts = [...new Set(gardens.map((g) => g.amphur).filter(Boolean))];
  const subdistricts = [
    ...new Set(gardens.map((g) => g.tambon).filter(Boolean)),
  ];
  const landTypes = [
    ...new Set(gardens.map((g) => g.landType).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, districtCodes, subdistrictCodes, landTypeCodes] =
    await Promise.all([
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
      // Use the correct column names for land types
      bulkEnsureRefCodes(
        "ref_land_types",
        "land_type",
        "land_type_id",
        landTypes,
        "GLTYPE"
      ),
    ]);

  return { provinceCodes, districtCodes, subdistrictCodes, landTypeCodes };
}

/**
 * Bulk insert or update durian gardens using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} gardens - Array of garden objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateDurianGardens(gardens) {
  if (!gardens || gardens.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes, landTypeCodes } =
      await bulkProcessReferenceCodes(gardens);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM durian_gardens");
    const beforeCount = countBefore[0].count;

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare garden data with rec_id generation
    const processedGardens = gardens.map((garden, index) => {
      // Handle GeoJSON parsing
      let geoJsonValue = null;
      if (garden.geojson) {
        try {
          geoJsonValue =
            typeof garden.geojson === "string"
              ? garden.geojson
              : JSON.stringify(garden.geojson);
        } catch (err) {
          console.warn(
            `Invalid GeoJSON for garden ${garden.landId}:`,
            err.message
          );
          geoJsonValue = null;
        }
      }

      // Generate rec_id if missing
      const recId =
        garden.recId || garden.landId || `DG_${beforeCount + index + 1}`;

      return [
        recId,
        garden.farmerId,
        garden.landId,
        provinceCodes[garden.province] || "UNKNOWN",
        districtCodes[garden.amphur] || "UNKNOWN",
        subdistrictCodes[garden.tambon] || "UNKNOWN",
        landTypeCodes[garden.landType] || "UNKNOWN",
        garden.lat || null,
        garden.lon || null,
        garden.noOfRais ?? 0,
        garden.noOfNgan ?? 0,
        garden.noOfWah ?? 0,
        garden.kml || null,
        geoJsonValue,
        garden.createdTime || null,
        garden.updatedTime || null,
        garden.companyId || null,
        bangkokTime,
      ];
    });

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    const query = `
      INSERT INTO durian_gardens (
        rec_id, farmer_id, land_id, garden_province_code, garden_district_code, 
        garden_subdistrict_code, land_type_id, lat, lon, no_of_rais, no_of_ngan, 
        no_of_wah, kml, geojson, created_at, updated_at, company_id, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        farmer_id = VALUES(farmer_id),
        garden_province_code = VALUES(garden_province_code),
        garden_district_code = VALUES(garden_district_code),
        garden_subdistrict_code = VALUES(garden_subdistrict_code),
        land_type_id = VALUES(land_type_id),
        lat = VALUES(lat),
        lon = VALUES(lon),
        no_of_rais = VALUES(no_of_rais),
        no_of_ngan = VALUES(no_of_ngan),
        no_of_wah = VALUES(no_of_wah),
        kml = VALUES(kml),
        geojson = VALUES(geojson),
        updated_at = VALUES(updated_at),
        company_id = VALUES(company_id),
        fetch_at = VALUES(fetch_at)
    `;

    // Use processedGardens directly
    const [result] = await connectionDB
      .promise()
      .query(query, [processedGardens]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM durian_gardens");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = gardens.length - actualInserts;

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
      totalProcessed: gardens.length,
    };
  } catch (err) {
    console.error("Bulk durian garden insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: gardens.length,
      error: err.message,
    };
  }
}
