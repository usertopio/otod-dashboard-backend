// ===================== Imports =====================
// Import API client for fetching communities data
import { getCommunities } from "../api/communities.js";
// Import DB helper for upserting community records
import { bulkInsertOrUpdateCommunities } from "../db/communitiesDb.js";

// ===================== Processor =====================
// CommunitiesProcessor handles fetching, deduplication, and DB upserts for communities.
export default class CommunitiesProcessor {
  /**
   * Fetches all community data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    let page = 1;
    let allCommunities = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Fetching page ${page}...`);
      const apiResult = await getCommunities({
        pageIndex: page,
        pageSize: 500,
      });
      if (!apiResult?.data?.length) break;
      console.log(`   ➡️  Got ${apiResult.data.length} communities`);
      allCommunities = allCommunities.concat(apiResult.data);
      page++;
      hasMore = apiResult.data.length === 500;
    }

    // Deduplicate by recId
    const uniqueCommunitiesMap = new Map();
    for (const community of allCommunities) {
      if (community.recId && !uniqueCommunitiesMap.has(community.recId)) {
        uniqueCommunitiesMap.set(community.recId, community);
      }
    }
    const uniqueCommunities = Array.from(uniqueCommunitiesMap.values());

    console.log(
      `🚀 Processing ${uniqueCommunities.length} unique communities using BULK operations...`
    );
    const result = await bulkInsertOrUpdateCommunities(uniqueCommunities);
    return result;
  }
}
