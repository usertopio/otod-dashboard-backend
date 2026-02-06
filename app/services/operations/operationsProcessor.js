// ===================== Imports =====================
// Import API client for fetching operations data
import { getOperations } from "../api/operations.js";
import { bulkInsertOrUpdateOperations } from "../db/operationsDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS_CONFIG } from "../../utils/constants.js";
import OperationsLogger from "./operationsLogger.js";

// ===================== Processor =====================
// OperationsProcessor handles fetching, deduplication, and DB upserts for operations.
export default class OperationsProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all operations data from API (by year, paginated)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all operations data from API (by year, paginated)
    const allOperations = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueOperations = this._getUniqueOperations(allOperations);

    // 4. Log summary
    OperationsLogger.logApiSummary(
      allOperations.length,
      uniqueOperations.length
    );

    // 5. Return data for service to handle insert
    return {
      success: true,
      data: uniqueOperations,
      recordCount: uniqueOperations.length,
      totalFromAPI: allOperations.length,
      totalBefore: dbCountBefore,
    };
  }

  /**
   * Fetches all pages of operations from the API (by year, paginated).
   */
  static async _fetchAllPages() {
    let allOperations = [];
    for (
      let year = OPERATIONS_CONFIG.START_YEAR;
      year <= OPERATIONS_CONFIG.END_YEAR;
      year++
    ) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const requestBody = {
          cropYear: year,
          fromDate: OPERATIONS_CONFIG.FROM_DATE,
          toDate: OPERATIONS_CONFIG.TO_DATE,
          provinceName: "",
          pageIndex: page,
          pageSize: OPERATIONS_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const operations = await getOperations(requestBody);
        const operationsCurPage = operations.data || [];
        allOperations = allOperations.concat(operationsCurPage);

        OperationsLogger.logPageInfo(year, page, operationsCurPage);

        hasMore =
          operationsCurPage.length === OPERATIONS_CONFIG.DEFAULT_PAGE_SIZE;
        page++;
      }
    }
    return allOperations;
  }

  /**
   * Deduplicates operations by recId.
   */
  static _getUniqueOperations(allOperations) {
    return allOperations.filter(
      (operation, index, self) =>
        index === self.findIndex((o) => o.recId === operation.recId)
    );
  }

  /**
   * Gets the current count of operations in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }
}
