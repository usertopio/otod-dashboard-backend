const { getCommunities } = require("../api/communities");
const { insertOrUpdateCommunity } = require("../db/communitiesDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { COMMUNITIES_CONFIG, OPERATIONS } = require("../../utils/constants");
const CommunitiesLogger = require("./communitiesLogger");

class CommunitiesProcessor {
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      COMMUNITIES_CONFIG.DEFAULT_TOTAL_RECORDS /
        COMMUNITIES_CONFIG.DEFAULT_PAGE_SIZE
    );

    // Initialize counters
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

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch data from all pages
    await this._fetchAllPages(pages, metrics);

    // Process unique communities
    const uniqueCommunities = this._getUniqueCommunities(
      metrics.allCommunitiesAllPages
    );
    CommunitiesLogger.logApiSummary(
      metrics.allCommunitiesAllPages.length,
      uniqueCommunities.length
    );

    // Process each unique community
    await this._processUniqueCommunities(uniqueCommunities, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: COMMUNITIES_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const communities = await getCommunities(requestBody, customHeaders);
      const allCommunitiesCurPage = communities.data;
      metrics.allCommunitiesAllPages = metrics.allCommunitiesAllPages.concat(
        allCommunitiesCurPage
      );

      CommunitiesLogger.logPageInfo(page, allCommunitiesCurPage);
    }
  }

  static _getUniqueCommunities(allCommunities) {
    return allCommunities.filter(
      (community, index, self) =>
        index === self.findIndex((c) => c.recId === community.recId)
    );
  }

  // 🔧 EXACT SAME PATTERN AS FARMERS
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

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }

  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    const result = {
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
      // 🔧 FIXED: Calculate duplicated data correctly like farmers
      duplicatedDataAmount:
        metrics.allCommunitiesAllPages.length -
        metrics.allCommunitiesAllPages.filter(
          (community, index, self) =>
            index === self.findIndex((c) => c.recId === community.recId)
        ).length,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights (like farmers)
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,
      recordsInDbNotInAPI: Math.max(
        0,
        dbCountBefore - metrics.processedRecIds.size
      ),
    };

    return result;
  }
}

module.exports = CommunitiesProcessor;
