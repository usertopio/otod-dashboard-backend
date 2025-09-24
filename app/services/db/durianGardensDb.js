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
 * Bulk insert or update durian gardens using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} gardens - Array of garden objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateDurianGardens(gardens) {
  if (!gardens || gardens.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    const bangkokTime = getBangkokTime();

    const processedGardens = gardens.map((garden) => [
      garden.recId ?? garden.landId, // <-- always set rec_id for DB
      garden.farmerId,
      garden.landId,
      garden.province,
      garden.amphur, // API 'amphur' → DB 'district'
      garden.tambon, // API 'tambon' → DB 'subdistrict'
      garden.landType,
      garden.lat ?? null,
      garden.lon ?? null,
      garden.noOfRais ?? null,
      garden.noOfNgan ?? null,
      garden.noOfWah ?? null,
      garden.kml ?? null,
      garden.geojson ?? null,
      garden.createdTime ?? null,
      garden.updatedTime ?? null,
      garden.companyId ?? null,
      bangkokTime,
    ]);

    const query = `
      INSERT INTO durian_gardens (
        rec_id, farmer_id, land_id, province, district, subdistrict, land_type,
        lat, lon, no_of_rais, no_of_ngan, no_of_wah, kml, geojson,
        created_at, updated_at, company_id, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        farmer_id = VALUES(farmer_id),
        land_id = VALUES(land_id),
        province = VALUES(province),
        district = VALUES(district),
        subdistrict = VALUES(subdistrict),
        land_type = VALUES(land_type),
        lat = VALUES(lat),
        lon = VALUES(lon),
        no_of_rais = VALUES(no_of_rais),
        no_of_ngan = VALUES(no_of_ngan),
        no_of_wah = VALUES(no_of_wah),
        kml = VALUES(kml),
        geojson = VALUES(geojson),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        company_id = VALUES(company_id),
        fetch_at = VALUES(fetch_at)
    `;

    const [result] = await connectionDB
      .promise()
      .query(query, [processedGardens]);

    return {
      inserted: result.affectedRows,
      updated: 0,
      errors: 0,
      totalAfter: processedGardens.length,
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
