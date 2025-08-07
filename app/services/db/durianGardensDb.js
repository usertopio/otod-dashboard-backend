const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 Copy ensureRefCode function from farmersDb.js pattern
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
    } else {
      // Generate new code if not found
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT ${codeColumn} FROM ${table} ORDER BY ${codeColumn} DESC LIMIT 1`
        );

      let newCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0][codeColumn];
        const lastNumber = parseInt(lastCode.replace(generatedCodePrefix, ""));
        newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
          3,
          "0"
        )}`;
      } else {
        newCode = `${generatedCodePrefix}001`;
      }

      await connectionDB.promise().query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) 
         VALUES (?, ?, 'generated')`,
        [newCode, name]
      );

      console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
      return newCode;
    }
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

// 🌿 Modern insertOrUpdate function with CORRECT column names
async function insertOrUpdateDurianGarden(garden) {
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
        } catch (e) {
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

    // Map fields with proper reference codes
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
      } catch (e) {
        values.created_at = null;
      }
    }
    if (values.updated_at && typeof values.updated_at === "string") {
      try {
        values.updated_at = new Date(values.updated_at);
      } catch (e) {
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
      // Update existing record
      const updateFields = Object.keys(values)
        .filter((key) => key !== "land_id")
        .map((key) => `${key} = ?`)
        .join(", ");

      const updateValues = Object.values(values).filter(
        (_, i) => Object.keys(values)[i] !== "land_id"
      );

      await connectionDB
        .promise()
        .query(`UPDATE durian_gardens SET ${updateFields} WHERE land_id = ?`, [
          ...updateValues,
          garden.landId,
        ]);

      return { operation: OPERATIONS.UPDATE, landId: garden.landId };
    } else {
      // Insert new record
      const insertFields = Object.keys(values);
      const insertPlaceholders = insertFields.map(() => "?");
      const insertValues = Object.values(values);

      await connectionDB
        .promise()
        .query(
          `INSERT INTO durian_gardens (${insertFields.join(
            ", "
          )}) VALUES (${insertPlaceholders.join(", ")})`,
          insertValues
        );

      return { operation: OPERATIONS.INSERT, landId: garden.landId };
    }
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

module.exports = {
  insertOrUpdateDurianGarden,
};
