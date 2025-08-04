const { getCrops } = require("../api/crops");
const { insertOrUpdateGap } = require("../db/gapDb");
const { connectionDB } = require("../../config/db/gap.conf");
const GapLogger = require("./gapLogger");
const { OPERATIONS } = require("../../utils/constants");

class GapProcessor {
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
      .query("SELECT COUNT(*) as count FROM gap");
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

    let allCropsAllPages = [];

    // Fetch all pages from GetCrops API (based on #attachments: totalRecords = 518)
    let totalRecords = 518;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        cropYear: 2024,
        provinceName: "",
        pageIndex: page,
        pageSize: pageSize,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      try {
        const response = await getCrops(requestBody, customHeaders);
        const crops = response.data || [];

        GapLogger.logPageInfo(page, crops);

        allCropsAllPages = allCropsAllPages.concat(crops);
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
      }
    }

    this.totalFromAPI = allCropsAllPages.length;

    // Extract GAP certificates from crops data and remove duplicates
    const gapCertificates = this._extractGapCertificates(allCropsAllPages);
    const uniqueGapCertificates = this._removeDuplicates(gapCertificates);

    this.uniqueFromAPI = uniqueGapCertificates.length;
    this.duplicatedDataAmount =
      gapCertificates.length - uniqueGapCertificates.length;

    GapLogger.logApiSummary(this.totalFromAPI, this.uniqueFromAPI);

    // Process unique GAP certificates
    await this._processUniqueGapCertificates(uniqueGapCertificates);

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

  _extractGapCertificates(crops) {
    const gapCertificates = [];

    crops.forEach((crop) => {
      // Only extract crops that have GAP certificate data
      if (crop.gapCertNumber && crop.gapCertNumber.trim() !== "") {
        gapCertificates.push({
          gapCertNumber: crop.gapCertNumber,
          gapCertType: crop.gapCertType,
          gapIssuedDate: crop.gapIssuedDate,
          gapExpiryDate: crop.gapExpiryDate,
          farmerId: crop.farmerId,
          landId: crop.landId,
        });
      }
    });

    return gapCertificates;
  }

  _removeDuplicates(gapCertificates) {
    const seen = new Set();
    return gapCertificates.filter((gap) => {
      if (seen.has(gap.gapCertNumber)) {
        return false;
      }
      seen.add(gap.gapCertNumber);
      return true;
    });
  }

  async _processUniqueGapCertificates(gapCertificates) {
    for (const gap of gapCertificates) {
      try {
        const result = await insertOrUpdateGap(gap);

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
          `Error processing GAP ${gap.gapCertNumber}:`,
          error.message
        );
        this.errors++;
      }
    }
  }
}

module.exports = GapProcessor;
