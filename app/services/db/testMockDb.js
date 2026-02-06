// Database operations for test_mock table

import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Get Bangkok timezone timestamp
 */
function getBangkokTime() {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
}

/**
 * Bulk insert or update test_mock records
 */
export async function bulkInsertOrUpdateTestMock(records) {
  if (!records || records.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, totalAfter: 0 };
  }

  const bangkokTime = getBangkokTime();

  const processedRecords = records.map((record) => [
    record.recId,
    record.name || null,
    record.description || null,
    record.status || 'active',
    record.createdTime || null,
    record.updatedTime || null,
    bangkokTime,
  ]);

  const query = `
    INSERT INTO test_mock (
      rec_id, name, description, status, created_at, updated_at, fetch_at
    ) VALUES ? 
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      status = VALUES(status),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at),
      fetch_at = VALUES(fetch_at)
  `;

  try {
    const [result] = await connectionDB.promise().query(query, [processedRecords]);

    // Get total count after operation
    const [countResult] = await connectionDB.promise().query(
      "SELECT COUNT(*) as count FROM test_mock"
    );
    const totalAfter = countResult[0].count;

    return {
      inserted: result.affectedRows - result.changedRows,
      updated: result.changedRows,
      errors: 0,
      totalAfter: totalAfter,
    };
  } catch (error) {
    console.error("❌ Error in bulkInsertOrUpdateTestMock:", error);
    throw error;
  }
}

/**
 * Get count of records in test_mock table
 */
export async function getTestMockCount() {
  try {
    const [result] = await connectionDB.promise().query(
      "SELECT COUNT(*) as count FROM test_mock"
    );
    return result[0].count;
  } catch (error) {
    console.error("❌ Error in getTestMockCount:", error);
    return 0;
  }
}

/**
 * Reset test_mock table
 */
export async function resetTestMockTable() {
  const connection = connectionDB.promise();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE test_mock");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    return { success: true };
  } catch (error) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    throw error;
  }
}
