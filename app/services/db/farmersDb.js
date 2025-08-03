const { connectionDB } = require("../../config/db/db.conf.js");

// Required for name → code lookup
async function getRefCode(table, nameColumn, codeColumn, name) {
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
      [name]
    );
  return rows.length > 0 ? rows[0][codeColumn] : null;
}

// If not found in ref → insert as 'generated'
async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix
) {
  let code = await getRefCode(table, nameColumn, codeColumn, name);
  if (!code) {
    // Create new code with prefix + timestamp
    code = `${generatedCodePrefix}${Date.now()}`;
    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [code, name]
      );
  }
  return code;
}

// Main insertOrUpdate function
async function insertOrUpdateFarmer(farmer) {
  try {
    // === Map province, district, subdistrict to codes ===
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      farmer.province,
      "GPROV"
    );

    const districtCode = await ensureRefCode(
      "ref_districts",
      "district_name_th",
      "district_code",
      farmer.amphur,
      "GDIST"
    );

    const subdistrictCode = await ensureRefCode(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      farmer.tambon,
      "GSUBDIST"
    );

    // === Prepare transformed data ===
    const values = {
      rec_id: farmer.recId,
      farmer_province_code: provinceCode,
      farmer_district_code: districtCode,
      farmer_subdistrict_code: subdistrictCode,
      farmer_id: farmer.farmerId,
      title: farmer.title,
      first_name: farmer.firstName,
      last_name: farmer.lastName,
      gender: farmer.gender,
      date_of_birth: farmer.dateOfBirth || null,
      id_card: farmer.idCard,
      id_card_expiry_date: farmer.idCardExpiryDate || null,
      address: farmer.addr,
      post_code: farmer.postCode,
      email: farmer.email,
      mobile_no: farmer.mobileNo,
      line_id: farmer.lineId,
      farmer_regist_number: farmer.farmerRegistNumber,
      farmer_regist_type: farmer.farmerRegistType,
      company_id: farmer.companyId,
      created_at: farmer.createdTime,
      updated_at: farmer.updatedTime,
      fetch_at: new Date(),
    };

    // === Check for existing rec_id ===
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM farmers WHERE rec_id = ? LIMIT 1`, [
        values.rec_id,
      ]);

    if (existing.length > 0) {
      // === Update ===
      const updateFields = Object.keys(values)
        .filter((key) => key !== "rec_id")
        .map((key) => `${key} = ?`)
        .join(", ");

      await connectionDB
        .promise()
        .query(`UPDATE farmers SET ${updateFields} WHERE rec_id = ?`, [
          ...Object.values(values).filter(
            (_, i) => Object.keys(values)[i] !== "rec_id"
          ),
          values.rec_id,
        ]);
    } else {
      // === Insert ===
      await connectionDB.promise().query(
        `INSERT INTO farmers (${Object.keys(values).join(
          ", "
        )}) VALUES (${Object.keys(values)
          .map(() => "?")
          .join(", ")})`,
        Object.values(values)
      );
    }
  } catch (err) {
    console.error("Farmer insert/update error:", err);
  }
}

module.exports = { insertOrUpdateFarmer };
