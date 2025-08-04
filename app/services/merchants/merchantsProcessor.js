const { getMerchants } = require("../api/merchants");
const { insertOrUpdateMerchant } = require("../db/merchantsDb");
const { connectionDB } = require("../../config/db/merchants.conf");
const MerchantsLogger = require("./merchantsLogger");
const { OPERATIONS } = require("../../utils/constants");

class MerchantsProcessor {
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
      .query("SELECT COUNT(*) as count FROM merchants");
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

    let allMerchantsAllPages = [];

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
        const response = await getMerchants(requestBody, customHeaders);
        const merchants = response.data || [];

        MerchantsLogger.logPageInfo(page + 1, merchants);

        allMerchantsAllPages = allMerchantsAllPages.concat(merchants);
      } catch (error) {
        console.error(`Error fetching page ${page + 1}:`, error.message);
      }
    }

    this.totalFromAPI = allMerchantsAllPages.length;

    // Remove duplicates by recId
    const uniqueMerchants = this._removeDuplicates(allMerchantsAllPages);
    this.uniqueFromAPI = uniqueMerchants.length;
    this.duplicatedDataAmount = this.totalFromAPI - this.uniqueFromAPI;

    MerchantsLogger.logApiSummary(this.totalFromAPI, this.uniqueFromAPI);

    // Process unique merchants
    await this._processUniqueMerchants(uniqueMerchants);

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

  _removeDuplicates(merchants) {
    const seen = new Set();
    return merchants.filter((merchant) => {
      if (seen.has(merchant.recId)) {
        return false;
      }
      seen.add(merchant.recId);
      return true;
    });
  }

  async _processUniqueMerchants(merchants) {
    for (const merchant of merchants) {
      try {
        const result = await insertOrUpdateMerchant(merchant);

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
          `Error processing merchant ${merchant.recId}:`,
          error.message
        );
        this.errors++;
      }
    }
  }
}

module.exports = MerchantsProcessor;
