// ===================== Imports =====================
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// ===================== Insert/Update =====================
/**
 * Inserts or updates a GAP certificate record in the database.
 * Checks for existence, and upserts accordingly.
 * @param {object} gap - GAP certificate data object.
 * @returns {Promise<object>} - Operation result.
 */
const insertOrUpdateGap = async (gap) => {
  try {
    // Check if GAP certificate already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM gap WHERE gap_cert_number = ? LIMIT 1`, [
        gap.gapCertNumber,
      ]);

    if (existing.length > 0) {
      // UPDATE existing GAP certificate
      await connectionDB.promise().query(
        `UPDATE gap SET 
         gap_cert_type = ?, 
         gap_issued_date = ?, 
         gap_expiry_date = ?, 
         farmer_id = ?, 
         land_id = ?, 
         fetch_at = NOW()
         WHERE gap_cert_number = ?`,
        [
          gap.gapCertType || null,
          gap.gapIssuedDate || null,
          gap.gapExpiryDate || null,
          gap.farmerId,
          gap.landId,
          gap.gapCertNumber,
        ]
      );

      return { operation: OPERATIONS.UPDATE, gapCertNumber: gap.gapCertNumber };
    } else {
      // INSERT new GAP certificate
      await connectionDB.promise().query(
        `INSERT INTO gap 
         (gap_cert_number, gap_cert_type, gap_issued_date, gap_expiry_date, 
          farmer_id, land_id, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          gap.gapCertNumber,
          gap.gapCertType || null,
          gap.gapIssuedDate || null,
          gap.gapExpiryDate || null,
          gap.farmerId,
          gap.landId,
        ]
      );

      return { operation: OPERATIONS.INSERT, gapCertNumber: gap.gapCertNumber };
    }
  } catch (err) {
    console.error("GAP insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      gapCertNumber: gap.gapCertNumber,
      error: err.message,
    };
  }
};

// ===================== Exports =====================
module.exports = {
  insertOrUpdateGap,
};
