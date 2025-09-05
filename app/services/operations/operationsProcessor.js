// operationsProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching operations data
import { getOperations } from "../api/operations.js";
import { insertOrUpdateOperation } from "../db/operationsDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS_CONFIG, OPERATIONS } from "../../utils/constants.js";
import OperationsLogger from "./operationsLogger.js";

// ===================== Processor =====================
// OperationsProcessor handles fetching, deduplication, and DB upserts for operations.
class OperationsProcessor {
  /**
   * Fetches all operation data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Initialize counters
    const metrics = {
      allOperationsAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

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

    // Process each unique operation
    await this._processUniqueOperations(uniqueOperations, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
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

        // const customHeaders = {
        //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        // };

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
   * Upserts each unique operation into the DB and updates metrics.
   * @param {Array} uniqueOperations - Array of unique operations.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueOperations(uniqueOperations, metrics) {
    for (const operation of uniqueOperations) {
      const result = await insertOrUpdateOperation(operation);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(operation.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(operation.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(operation.recId);
          break;
      }

      metrics.processedRecIds.add(operation.recId);
    }
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

  /**
   * Builds a detailed result object with metrics and insights.
   * @param {object} metrics - Metrics object.
   * @param {number} dbCountBefore - DB count before processing.
   * @param {number} dbCountAfter - DB count after processing.
   * @returns {object} - Result summary.
   */
  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    return {
      // Database metrics
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      inserted: metrics.insertCount,
      updated: metrics.updateCount,
      errors: metrics.errorCount,
      growth: dbCountAfter - dbCountBefore,

      // API metrics
      totalFromAPI: metrics.allOperationsAllPages.length,
      uniqueFromAPI: metrics.allOperationsAllPages.filter(
        (operation, index, self) =>
          index === self.findIndex((o) => o.recId === operation.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allOperationsAllPages.length -
        metrics.insertCount -
        metrics.updateCount,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      recordsInDbNotInAPI: dbCountBefore - metrics.updateCount,
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,

      // For compatibility
      allOperationsAllPages: metrics.allOperationsAllPages,
    };
  }
}

// ===================== Exports =====================
export default OperationsProcessor;
