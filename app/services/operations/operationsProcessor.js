// ===================== Imports =====================
// Import API client for fetching operations data
import { getOperations } from "../api/operations.js";
import { bulkInsertOrUpdateOperations } from "../db/operationsDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS_CONFIG } from "../../utils/constants.js";
import OperationsLogger from "./operationsLogger.js";

// ===================== Processor =====================
// OperationsProcessor handles fetching, deduplication, and DB upserts for operations.
class OperationsProcessor {
  /**
   * Fetches all operation data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Initialize metrics
    const metrics = {
      allOperationsAllPages: [],
    };

    // Fetch data from all pages
    await this._fetchOperationsPages(metrics);

    // Process unique operations
    const uniqueOperations = this._getUniqueOperations(
      metrics.allOperationsAllPages
    );

    OperationsLogger.logApiSummary(
      metrics.allOperationsAllPages.length,
      uniqueOperations.length
    );

    // Process all operations at once
    console.log(
      `🚀 Processing ${uniqueOperations.length} unique operations using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateOperations(uniqueOperations);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      skipped: bulkResult.skipped || 0,
      totalProcessed: uniqueOperations.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
    };
  }

  /**
   * Fetches all pages of operations from the API and logs each page.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchOperationsPages(metrics) {
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
        metrics.allOperationsAllPages =
          metrics.allOperationsAllPages.concat(operationsCurPage);

        // Standardized log
        OperationsLogger.logPageInfo(year, page, operationsCurPage);

        if (!operationsCurPage || operationsCurPage.length === 0)
          hasMore = false;
        page++;
      }
    }
  }

  /**
   * Deduplicates operations by recId.
   * @param {Array} allOperations - Array of all operations from API.
   * @returns {Array} - Array of unique operations.
   */
  static _getUniqueOperations(allOperations) {
    return allOperations.filter(
      (operation, index, self) =>
        index === self.findIndex((o) => o.recId === operation.recId)
    );
  }

  /**
   * Gets the current count of operations in the DB.
   * @returns {Promise<number>} - Total number of operations.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }
}

export default OperationsProcessor;
