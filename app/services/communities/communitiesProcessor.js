// ===================== Imports =====================
// Import API client for fetching communities data
const { getCommunities } = require("../api/communities");
// Import DB helper for upserting community records
const { insertOrUpdateCommunity } = require("../db/communitiesDb");
// Import DB connection for direct queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import config constants and operation enums
const { COMMUNITIES_CONFIG, OPERATIONS } = require("../../utils/constants");
// Import logger for structured process logging
const CommunitiesLogger = require("./communitiesLogger");

// ===================== Processor =====================
// CommunitiesProcessor handles fetching, deduplication, and DB upserts for communities.
class CommunitiesProcessor {
  /**
   * Fetches all community data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Initialize metrics for tracking processing
    const metrics = {
      allCommunitiesAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get DB count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch all pages from the API and accumulate results
    await this._fetchCommunitiesPages(metrics);

    // Deduplicate communities by recId
    const uniqueCommunities = this._getUniqueCommunities(
      metrics.allCommunitiesAllPages
    );
    CommunitiesLogger.logApiSummary(
      metrics.allCommunitiesAllPages.length,
      uniqueCommunities.length
    );

    // Upsert each unique community into the DB and update metrics
    await this._processUniqueCommunities(uniqueCommunities, metrics);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Build and return a detailed result object
    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  /**
   * Fetches all pages of communities from the API and logs each page.
   * @param {number} pages - Number of pages to fetch.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchCommunitiesPages(metrics) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: COMMUNITIES_CONFIG.DEFAULT_PAGE_SIZE,
      };

      // const customHeaders = {
      //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      // };

      // Fetch a page of communities from the API
      const communities = await getCommunities(requestBody);
      const allCommunitiesCurPage = communities.data || [];
      metrics.allCommunitiesAllPages = metrics.allCommunitiesAllPages.concat(
        allCommunitiesCurPage
      );

      // Log info for this page
      CommunitiesLogger.logPageInfo(1, page, allCommunitiesCurPage);

      // Stop if no more data
      if (allCommunitiesCurPage.length < COMMUNITIES_CONFIG.DEFAULT_PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  /**
   * Deduplicates communities by recId.
   * @param {Array} allCommunities - Array of all communities from API.
   * @returns {Array} - Array of unique communities.
   */
  static _getUniqueCommunities(allCommunities) {
    return allCommunities.filter(
      (community, index, self) =>
        index === self.findIndex((c) => c.recId === community.recId)
    );
  }

  /**
   * Upserts each unique community into the DB and updates metrics.
   * @param {Array} uniqueCommunities - Array of unique communities.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueCommunities(uniqueCommunities, metrics) {
    for (const community of uniqueCommunities) {
      const result = await insertOrUpdateCommunity(community);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(community.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(community.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(community.recId);
          break;
      }

      metrics.processedRecIds.add(community.recId);
    }
  }

  /**
   * Gets the current count of communities in the DB.
   * @returns {Promise<number>} - Total number of communities.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
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
      totalFromAPI: metrics.allCommunitiesAllPages.length,
      uniqueFromAPI: metrics.allCommunitiesAllPages.filter(
        (community, index, self) =>
          index === self.findIndex((c) => c.recId === community.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allCommunitiesAllPages.length -
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
      allCommunitiesAllPages: metrics.allCommunitiesAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = CommunitiesProcessor;
