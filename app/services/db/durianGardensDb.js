const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🌿 Helper function to ensure reference codes exist
async function ensureRefCode(
  tableName,
  nameField,
  codeField,
  nameValue,
  prefix
) {
  if (!nameValue) return null;

  // Check if the code already exists
  const [existing] = await connectionDB
    .promise()
    .query(
      `SELECT ${codeField} FROM ${tableName} WHERE ${nameField} = ? LIMIT 1`,
      [nameValue]
    );

  if (existing.length > 0) {
    return existing[0][codeField];
  }

  // Generate new code if not exists
  const [maxResult] = await connectionDB
    .promise()
    .query(
      `SELECT MAX(CAST(SUBSTRING(${codeField}, 6) AS UNSIGNED)) as maxNum FROM ${tableName} WHERE ${codeField} LIKE '${prefix}%'`
    );

  const nextNum = (maxResult[0].maxNum || 0) + 1;
  const newCode = `${prefix}${nextNum.toString().padStart(4, "0")}`;

  // Insert new reference code
  await connectionDB
    .promise()
    .query(
      `INSERT INTO ${tableName} (${codeField}, ${nameField}) VALUES (?, ?)`,
      [newCode, nameValue]
    );

  return newCode;
}

// 🌿 Modern insertOrUpdate function with correct field mappings
async function insertOrUpdateDurianGarden(garden) {
  try {
    // === Map province, district, subdistrict to codes ===
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

    // 🌿 Map fields based on actual API responses and database schema
    const values = {
      rec_id: garden.recId || null, // From GetLands API
      farmer_id: garden.farmerId, // From both APIs
      land_id: garden.landId, // From both APIs (UNIQUE key)
      garden_province_code: provinceCode,
      garden_district_code: districtCode,
      garden_subdistrict_code: subdistrictCode,
      land_type_id: garden.landType || "", // From both APIs
      lat: garden.lat || null, // From both APIs
      lon: garden.lon || null, // From both APIs
      no_of_rais: garden.noOfRais || null, // From both APIs
      no_of_ngan: garden.noOfNgan || null, // From both APIs
      no_of_wah: garden.noOfWah || null, // From both APIs
      kml: garden.kml || null, // From GetLands API
      geojson: garden.geojson || null, // From GetLandGeoJSON API
      created_at: garden.createdTime || null, // From GetLands API
      updated_at: garden.updatedTime || null, // From GetLands API
      company_id: garden.companyId || null, // From GetLands API
      fetch_at: new Date(), // Current timestamp
    };

    // Handle date formatting for MySQL
    if (values.created_at && typeof values.created_at === "string") {
      values.created_at = new Date(values.created_at);
    }
    if (values.updated_at && typeof values.updated_at === "string") {
      values.updated_at = new Date(values.updated_at);
    }

    // Handle JSON field
    if (values.geojson && typeof values.geojson === "string") {
      try {
        values.geojson = JSON.parse(values.geojson);
      } catch (e) {
        // If it's not valid JSON, store as string
        values.geojson = values.geojson;
      }
    }

    // 🌿 Check for existing land_id (unique key)
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM durian_gardens WHERE land_id = ? LIMIT 1`, [
        garden.landId,
      ]);

    if (existing.length > 0) {
      // === Update ===
      const updateFields = Object.keys(values)
        .filter((key) => key !== "land_id")
        .map((key) => `${key} = ?`)
        .join(", ");

      await connectionDB
        .promise()
        .query(`UPDATE durian_gardens SET ${updateFields} WHERE land_id = ?`, [
          ...Object.values(values).filter(
            (_, i) => Object.keys(values)[i] !== "land_id"
          ),
          garden.landId,
        ]);

      return { operation: OPERATIONS.UPDATE, landId: garden.landId };
    } else {
      // === Insert ===
      await connectionDB.promise().query(
        `INSERT INTO durian_gardens (${Object.keys(values).join(
          ", "
        )}) VALUES (${Object.keys(values)
          .map(() => "?")
          .join(", ")})`,
        Object.values(values)
      );

      return { operation: OPERATIONS.INSERT, landId: garden.landId };
    }
  } catch (err) {
    console.error("Durian garden insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      landId: garden.landId,
      error: err.message,
    };
  }
}

// 🌿 Export only the modern function
module.exports = {
  insertOrUpdateDurianGarden,
};
