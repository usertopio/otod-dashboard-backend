const { getOperations } = require("../api/operations");
const { insertOrUpdateOperation } = require("../db/operationsDb");
const { connectionDB } = require("../../config/db/operations.conf");
const OperationsLogger = require("./operationsLogger");
const { OPERATIONS } = require("../../utils/constants");

class OperationsProcessor {
  constructor() {
    this.totalFromAPI = 0;
    this.uniqueFromAPI = 0;
    this.inserted = 0;
    this.updated = 0;
    this.errors = 0;
    this.duplicatedDataAmount = 0;
  }

  async getCurrentCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM operations");
    return result[0].count;
  }

  async fetchAndProcessData(attempt) {
    const totalBefore = await this.getCurrentCount();

    // Reset counters for this attempt
    this.totalFromAPI = 0;
    this.uniqueFromAPI = 0;
    this.inserted = 0;
    this.updated = 0;
    this.errors = 0;

    let allOperationsAllPages = [];

    // Fetch all pages
    let totalRecords = 0; // Based on your target: 0
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize) || 1; // At least 1 page

    for (let page = 0; page < pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: pageSize,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      try {
        const response = await getOperations(requestBody, customHeaders);
        const operations = response.data || [];

        OperationsLogger.logPageInfo(page + 1, operations);

        allOperationsAllPages = allOperationsAllPages.concat(operations);
      } catch (error) {
        console.error(`Error fetching page ${page + 1}:`, error.message);
      }
    }

    this.totalFromAPI = allOperationsAllPages.length;

    // Remove duplicates by recId
    const uniqueOperations = this._removeDuplicates(allOperationsAllPages);
    this.uniqueFromAPI = uniqueOperations.length;
    this.duplicatedDataAmount = this.totalFromAPI - this.uniqueFromAPI;

    OperationsLogger.logApiSummary(this.totalFromAPI, this.uniqueFromAPI);

    // Process unique operations
    await this._processUniqueOperations(uniqueOperations);

    const totalAfter = await this.getCurrentCount();

    return {
      totalBefore,
      totalAfter,
      totalFromAPI: this.totalFromAPI,
      uniqueFromAPI: this.uniqueFromAPI,
      inserted: this.inserted,
      updated: this.updated,
      errors: this.errors,
      duplicatedDataAmount: this.duplicatedDataAmount,
      attempts: attempt,
    };
  }

  _removeDuplicates(operations) {
    const seen = new Set();
    return operations.filter((operation) => {
      if (seen.has(operation.recId)) {
        return false;
      }
      seen.add(operation.recId);
      return true;
    });
  }

  async _processUniqueOperations(operations) {
    for (const operation of operations) {
      try {
        const result = await insertOrUpdateOperation(operation);

        switch (result.operation) {
          case OPERATIONS.INSERT:
            this.inserted++;
            break;
          case OPERATIONS.UPDATE:
            this.updated++;
            break;
          case OPERATIONS.ERROR:
            this.errors++;
            break;
        }
      } catch (error) {
        console.error(
          `Error processing operation ${operation.recId}:`,
          error.message
        );
        this.errors++;
      }
    }
  }
}

module.exports = OperationsProcessor;
