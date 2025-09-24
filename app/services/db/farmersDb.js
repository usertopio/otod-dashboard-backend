// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Get Bangkok timezone timestamp as MySQL-compatible string
 */
function getBangkokTime() {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
}

// ===================== DB Utilities =====================

/**
 * Bulk insert or update farmers using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} farmers - Array of farmer objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateFarmers(farmers) {
  const bangkokTime = getBangkokTime();

  const processedFarmers = farmers.map((farmer) => [
    farmer.recId,
    farmer.province,
    farmer.amphur,
    farmer.tambon,
    farmer.farmerId,
    farmer.title || null,
    farmer.firstName,
    farmer.lastName,
    farmer.gender || null,
    farmer.dateOfBirth || null,
    farmer.idCard,
    farmer.idCardExpiryDate || null,
    farmer.addr || null,
    farmer.postCode,
    farmer.email || null,
    farmer.mobileNo,
    farmer.lineId || null,
    farmer.farmerRegistNumber || null,
    farmer.farmerRegistType || null,
    farmer.companyId,
    farmer.createdTime,
    farmer.updatedTime,
    bangkokTime,
  ]);

  const query = `
    INSERT INTO farmers (
      rec_id, province, district, subdistrict, 
      farmer_id, title, first_name, last_name, gender, date_of_birth, id_card, 
      id_card_expiry_date, address, post_code, email, mobile_no, line_id, 
      farmer_regist_number, farmer_regist_type, company_id, created_at, updated_at, fetch_at
    ) VALUES ? 
    ON DUPLICATE KEY UPDATE
      province = VALUES(province),
      district = VALUES(district),
      subdistrict = VALUES(subdistrict),
      farmer_id = VALUES(farmer_id),
      title = VALUES(title),
      first_name = VALUES(first_name),
      last_name = VALUES(last_name), 
      gender = VALUES(gender),
      date_of_birth = VALUES(date_of_birth),
      id_card = VALUES(id_card),
      id_card_expiry_date = VALUES(id_card_expiry_date),
      address = VALUES(address),
      post_code = VALUES(post_code),
      email = VALUES(email),
      mobile_no = VALUES(mobile_no),
      line_id = VALUES(line_id),
      farmer_regist_number = VALUES(farmer_regist_number),
      farmer_regist_type = VALUES(farmer_regist_type),
      company_id = VALUES(company_id),
      updated_at = VALUES(updated_at),
      fetch_at = VALUES(fetch_at)
  `;

  const [result] = await connectionDB
    .promise()
    .query(query, [processedFarmers]);
  return {
    inserted: result.affectedRows,
    updated: 0,
    errors: 0,
    totalAfter: processedFarmers.length,
  };
}
