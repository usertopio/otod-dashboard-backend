const { getCommunities } = require("../api/communities");
const { insertCommunities } = require("../db/communitiesDb");
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

  static async _processUniqueCommunities(uniqueCommunities, metrics) {
    for (const community of uniqueCommunities) {
      const result = await this._insertOrUpdateCommunity(community);

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

  static async _insertOrUpdateCommunity(community) {
    try {
      // Check if community already exists
      const [existing] = await connectionDB
        .promise()
        .query(`SELECT id FROM communities WHERE recId = ? LIMIT 1`, [
          community.recId,
        ]);

      if (existing.length > 0) {
        // Update existing community
        await connectionDB.promise().query(
          `UPDATE communities SET 
             province = ?, amphur = ?, tambon = ?, postCode = ?, commId = ?, 
             commName = ?, totalMembers = ?, noOfRais = ?, noOfTrees = ?, 
             forecastYield = ?, createdTime = ?, updatedTime = ?, companyId = ?, companyName = ?
             WHERE recId = ?`,
          [
            community.province,
            community.amphur,
            community.tambon,
            community.postCode,
            community.commId,
            community.commName,
            community.totalMembers,
            community.noOfRais,
            community.noOfTrees,
            community.forecastYield,
            community.createdTime,
            community.updatedTime,
            community.companyId,
            community.companyName,
            community.recId,
          ]
        );
        return { operation: OPERATIONS.UPDATE, recId: community.recId };
      } else {
        // Insert new community using existing function
        insertCommunities(community);
        return { operation: OPERATIONS.INSERT, recId: community.recId };
      }
    } catch (err) {
      console.error("Community insert/update error:", err);
      return {
        operation: OPERATIONS.ERROR,
        recId: community.recId,
        error: err.message,
      };
    }
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
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

module.exports = CommunitiesProcessor;
