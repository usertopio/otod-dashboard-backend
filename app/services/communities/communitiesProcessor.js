// ===================== Imports =====================
// Import API client for fetching communities data
import { getCommunities } from "../api/communities.js";
// Import DB helper for upserting community records
import { bulkInsertOrUpdateCommunities } from "../db/communitiesDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { COMMUNITIES_CONFIG, OPERATIONS } from "../../utils/constants.js";
// Import logger for structured process logging (default export)
import CommunitiesLogger from "./communitiesLogger.js";

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

    // BULK PROCESSING: Process all communities at once
    console.log(
      `🚀 Processing ${uniqueCommunities.length} unique communities using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateCommunities(uniqueCommunities);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueCommunities.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
    };
  }

  /**
   * Fetches all pages of communities from the API and logs each page.
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
   * Gets the current count of communities in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }
}

// ===================== Exports =====================
export default CommunitiesProcessor;
