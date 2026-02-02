// ===================== Imports =====================
// Import API client for fetching communities data
import { getCommunities } from "../api/communities.js";
import { bulkInsertOrUpdateCommunities } from "../db/communitiesDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import CommunitiesLogger from "./communitiesLogger.js";

// ===================== Processor =====================
// CommunitiesProcessor handles fetching, deduplication, and DB upserts for communities.
export default class CommunitiesProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all communities data from API (paginated)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all communities data from API (paginated)
    const allCommunities = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueCommunities = this._getUniqueCommunities(allCommunities);

    // 4. Log summary
    CommunitiesLogger.logApiSummary(
      allCommunities.length,
      uniqueCommunities.length
    );

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateCommunities(uniqueCommunities);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueCommunities.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allCommunities.length,
      uniqueFromAPI: uniqueCommunities.length,
    };
  }

  /**
   * Fetches all pages of communities from the API (paginated).
   */
  static async _fetchAllPages() {
    let page = 1;
    let allCommunities = [];
    let hasMore = true;
    while (hasMore) {
      try {
        const apiResult = await getCommunities({
          pageIndex: page,
          pageSize: 500,
        });
        if (!apiResult?.data?.length) break;
        allCommunities = allCommunities.concat(apiResult.data);
        page++;
        hasMore = apiResult.data.length === 500;
      } catch (error) {
        console.error(`❌ Error fetching communities page ${page}:`, error.message);
        throw new Error(`Failed to fetch communities at page ${page}: ${error.message}`);
      }
    }
    return allCommunities;
  }

  /**
   * Deduplicates communities by recId.
   */
  static _getUniqueCommunities(allCommunities) {
    const uniqueMap = new Map();
    for (const community of allCommunities) {
      if (community.recId && !uniqueMap.has(community.recId)) {
        uniqueMap.set(community.recId, community);
      }
    }
    return Array.from(uniqueMap.values());
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
