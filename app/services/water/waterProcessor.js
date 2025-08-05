const { getWaterUsageSummaryByMonth } = require("../api/water");
const { insertOrUpdateWater } = require("../db/waterDb");
const { connectionDB } = require("../../config/db/db.conf");
const WaterLogger = require("./waterLogger");
const { OPERATIONS } = require("../../utils/constants");

class WaterProcessor {
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
      .query("SELECT COUNT(*) as count FROM water");
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

    // Single API call - GetWaterUsageSummaryByMonth only
    const requestBody = {
      cropYear: 2024,
      provinceName: "",
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    let allWaterData = [];

    try {
      const response = await getWaterUsageSummaryByMonth(
        requestBody,
        customHeaders
      );
      allWaterData = response.data || [];

      WaterLogger.logApiCall(allWaterData);
    } catch (error) {
      console.error(`Error fetching water data:`, error.message);
    }

    this.totalFromAPI = allWaterData.length;

    // Remove duplicates by unique combination of cropYear, provinceName, operMonth
    const uniqueWaterData = this._removeDuplicates(allWaterData);
    this.uniqueFromAPI = uniqueWaterData.length;
    this.duplicatedDataAmount = this.totalFromAPI - this.uniqueFromAPI;

    WaterLogger.logApiSummary(this.totalFromAPI, this.uniqueFromAPI);

    // Process unique water data
    await this._processUniqueWaterData(uniqueWaterData);

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

  _removeDuplicates(waterData) {
    const seen = new Set();
    return waterData.filter((water) => {
      // Create unique key from combination of fields
      const uniqueKey = `${water.cropYear}-${water.provinceName}-${water.operMonth}`;
      if (seen.has(uniqueKey)) {
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  }

  async _processUniqueWaterData(waterData) {
    for (const water of waterData) {
      try {
        const result = await insertOrUpdateWater(water);

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
          `Error processing water ${water.provinceName}-${water.operMonth}:`,
          error.message
        );
        this.errors++;
      }
    }
  }
}

module.exports = WaterProcessor;
