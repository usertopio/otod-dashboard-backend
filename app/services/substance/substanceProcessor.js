const { getSubstanceUsageSummaryByMonth } = require("../api/substance");
const { insertOrUpdateSubstance } = require("../db/substanceDb");
const { connectionDB } = require("../../config/db/db.conf");
const SubstanceLogger = require("./substanceLogger");
const { OPERATIONS } = require("../../utils/constants");

class SubstanceProcessor {
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
      .query("SELECT COUNT(*) as count FROM substance");
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

    // Single API call - GetSubstanceUsageSummaryByMonth only
    const requestBody = {
      cropYear: 2024,
      provinceName: "",
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    let allSubstanceData = [];

    try {
      const response = await getSubstanceUsageSummaryByMonth(
        requestBody,
        customHeaders
      );
      allSubstanceData = response.data || [];

      SubstanceLogger.logApiCall(allSubstanceData);
    } catch (error) {
      console.error(`Error fetching substance data:`, error.message);
    }

    this.totalFromAPI = allSubstanceData.length;

    // Remove duplicates by unique combination of cropYear, provinceName, substance, operMonth
    const uniqueSubstanceData = this._removeDuplicates(allSubstanceData);
    this.uniqueFromAPI = uniqueSubstanceData.length;
    this.duplicatedDataAmount = this.totalFromAPI - this.uniqueFromAPI;

    SubstanceLogger.logApiSummary(this.totalFromAPI, this.uniqueFromAPI);

    // Process unique substance data
    await this._processUniqueSubstanceData(uniqueSubstanceData);

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

  _removeDuplicates(substanceData) {
    const seen = new Set();
    return substanceData.filter((substance) => {
      // Create unique key from combination of fields
      const uniqueKey = `${substance.cropYear}-${substance.provinceName}-${substance.substance}-${substance.operMonth}`;
      if (seen.has(uniqueKey)) {
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  }

  async _processUniqueSubstanceData(substanceData) {
    for (const substance of substanceData) {
      try {
        const result = await insertOrUpdateSubstance(substance);

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
          `Error processing substance ${substance.substance}:`,
          error.message
        );
        this.errors++;
      }
    }
  }
}

module.exports = SubstanceProcessor;
