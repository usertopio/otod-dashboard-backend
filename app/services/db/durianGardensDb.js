// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting durian gardens

/**
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string|null>} - The code or null.
 */
async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix
) {
  if (!name) return null;

  try {
    // Check if name exists in reference table
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
        [name]
      );

    if (existing.length > 0) {
      return existing[0][codeColumn];
    }

    // Generate new code if not found
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let newCode;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      const lastNumber = parseInt(
        String(lastCode).replace(generatedCodePrefix, ""),
        10
      );
      newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
        3,
        "0"
      )}`;
    } else {
      newCode = `${generatedCodePrefix}001`;
    }

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [newCode, name]
      );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

/**
 * Inserts or updates a durian garden record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} garden - Durian garden data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateDurianGarden(garden) {
  try {
    // === Map province, district, subdistrict, land type to codes ===
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      garden.province,
      "GPROV"
    );

    const districtCode = await ensureRefCode(
      "ref_districts",
      "district_name_th",
      "district_code",
      garden.amphur,
      "GDIST"
    );

    const subdistrictCode = await ensureRefCode(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      garden.tambon,
      "GSUBDIST"
    );

    const landTypeId = await ensureRefCode(
      "ref_land_types",
      "land_type",
      "land_type_id",
      garden.landType,
      "GLAND"
    );

    // Handle geojson field
    let geoJsonValue = null;
    if (garden.geojson) {
      if (typeof garden.geojson === "string") {
        try {
          const parsed = JSON.parse(garden.geojson);
          geoJsonValue = JSON.stringify(parsed);
        } catch {
          geoJsonValue = JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { originalData: garden.geojson },
                geometry: null,
              },
            ],
          });
        }
      } else if (typeof garden.geojson === "object") {
        geoJsonValue = JSON.stringify(garden.geojson);
      }
    }

    // Generate rec_id if not provided - use land_id as fallback
    const recId =
      garden.recId ||
      garden.landId ||
      `DURIAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare values in fixed order
    const values = {
      rec_id: recId,
      farmer_id: garden.farmerId,
      land_id: garden.landId,
      garden_province_code: provinceCode || "UNKNOWN",
      garden_district_code: districtCode || "UNKNOWN",
      garden_subdistrict_code: subdistrictCode || "UNKNOWN",
      land_type_id: landTypeId || "UNKNOWN",
      lat: garden.lat || null,
      lon: garden.lon || null,
      no_of_rais: garden.noOfRais ?? 0,
      no_of_ngan: garden.noOfNgan ?? 0,
      no_of_wah: garden.noOfWah ?? 0,
      kml: garden.kml || null,
      geojson: geoJsonValue,
      created_at: garden.createdTime || null,
      updated_at: garden.updatedTime || null,
      company_id: garden.companyId || null,
      fetch_at: new Date(),
    };

    // Handle date formatting for MySQL
    if (values.created_at && typeof values.created_at === "string") {
      try {
        values.created_at = new Date(values.created_at);
      } catch {
        values.created_at = null;
      }
    }
    if (values.updated_at && typeof values.updated_at === "string") {
      try {
        values.updated_at = new Date(values.updated_at);
      } catch {
        values.updated_at = null;
      }
    }

    // Check for existing land_id (unique key)
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM durian_gardens WHERE land_id = ? LIMIT 1`, [
        garden.landId,
      ]);

    if (existing.length > 0) {
      // Direct SQL UPDATE
      await connectionDB.promise().query(
        `UPDATE durian_gardens SET 
            rec_id = ?, farmer_id = ?, garden_province_code = ?, garden_district_code = ?, 
            garden_subdistrict_code = ?, land_type_id = ?, lat = ?, lon = ?, no_of_rais = ?, 
            no_of_ngan = ?, no_of_wah = ?, kml = ?, geojson = ?, updated_at = ?, company_id = ?, fetch_at = ?
           WHERE land_id = ?`,
        [
          values.rec_id,
          values.farmer_id,
          values.garden_province_code,
          values.garden_district_code,
          values.garden_subdistrict_code,
          values.land_type_id,
          values.lat,
          values.lon,
          values.no_of_rais,
          values.no_of_ngan,
          values.no_of_wah,
          values.kml,
          values.geojson,
          values.updated_at,
          values.company_id,
          values.fetch_at,
          garden.landId,
        ]
      );
      return { operation: OPERATIONS.UPDATE, landId: garden.landId };
    }

    // Direct SQL INSERT
    await connectionDB.promise().query(
      `INSERT INTO durian_gardens 
          (rec_id, farmer_id, land_id, garden_province_code, garden_district_code, garden_subdistrict_code, 
           land_type_id, lat, lon, no_of_rais, no_of_ngan, no_of_wah, kml, geojson, created_at, updated_at, company_id, fetch_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.rec_id,
        values.farmer_id,
        values.land_id,
        values.garden_province_code,
        values.garden_district_code,
        values.garden_subdistrict_code,
        values.land_type_id,
        values.lat,
        values.lon,
        values.no_of_rais,
        values.no_of_ngan,
        values.no_of_wah,
        values.kml,
        values.geojson,
        values.created_at,
        values.updated_at,
        values.company_id,
        values.fetch_at,
      ]
    );
    return { operation: OPERATIONS.INSERT, landId: garden.landId };
  } catch (err) {
    console.error("🔧 Durian garden insert/update error:", err);
    console.error("🔧 Garden data causing error:", {
      landId: garden.landId,
      farmerId: garden.farmerId,
      province: garden.province,
      amphur: garden.amphur,
      tambon: garden.tambon,
      landType: garden.landType,
      hasGeojson: !!garden.geojson,
    });
    return {
      operation: OPERATIONS.ERROR,
      landId: garden.landId,
      error: err.message,
    };
  }
}
