const { getOperations } = require("../api/operations");
const { insertOrUpdateOperation } = require("../db/operationsDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS_CONFIG, OPERATIONS } = require("../../utils/constants");
const OperationsLogger = require("./operationsLogger");

class OperationsProcessor {
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      OPERATIONS_CONFIG.DEFAULT_TOTAL_RECORDS /
        OPERATIONS_CONFIG.DEFAULT_PAGE_SIZE
    );

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
    await this._fetchAllPages(pages, metrics);

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

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        cropYear: OPERATIONS_CONFIG.DEFAULT_CROP_YEAR || 2024,
        provinceName: "",
        pageIndex: page,
        pageSize: OPERATIONS_CONFIG.DEFAULT_PAGE_SIZE,
        fromDate: OPERATIONS_CONFIG.DEFAULT_FROM_DATE || "2024-01-01",
        toDate: OPERATIONS_CONFIG.DEFAULT_TO_DATE || "2024-12-31",
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const operations = await getOperations(requestBody, customHeaders);
      const allOperationsCurPage = operations.data;
      metrics.allOperationsAllPages =
        metrics.allOperationsAllPages.concat(allOperationsCurPage);

      OperationsLogger.logPageInfo(page, allOperationsCurPage);
    }
  }

  static _getUniqueOperations(allOperations) {
    return allOperations.filter(
      (operation, index, self) =>
        index === self.findIndex((o) => o.recId === operation.recId)
    );
  }

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

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }

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

module.exports = OperationsProcessor;
