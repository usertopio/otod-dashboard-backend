// ===================== Imports =====================
// Import API client for fetching farmers data
import { getFarmers } from "../api/farmers.js";
// Import DB helper for bulk upserting farmer records
import { bulkInsertOrUpdateFarmers } from "../db/farmersDb.js";

// ===================== Processor =====================
// FarmersProcessor handles fetching, deduplication, and DB upserts for farmers.
export default class FarmersProcessor {
  /**
   * Fetches all farmer data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    let page = 1;
    let allFarmers = [];
    let hasMore = true;

    // Fetch all pages and accumulate farmers
    while (hasMore) {
      console.log(`📄 Fetching page ${page}...`);
      const apiResult = await getFarmers({ pageIndex: page, pageSize: 500 });
      if (!apiResult?.data?.length) break;
      console.log(`   ➡️  Got ${apiResult.data.length} farmers`);
      allFarmers = allFarmers.concat(apiResult.data);
      page++;
      hasMore = apiResult.data.length === 500;
    }

    // Deduplicate by recId
    const uniqueFarmersMap = new Map();
    for (const farmer of allFarmers) {
      if (!uniqueFarmersMap.has(farmer.recId)) {
        uniqueFarmersMap.set(farmer.recId, farmer);
      }
    }
    const uniqueFarmers = Array.from(uniqueFarmersMap.values());

    console.log(
      `🚀 Processing ${uniqueFarmers.length} unique farmers using BULK operations...`
    );
    const result = await bulkInsertOrUpdateFarmers(uniqueFarmers);
    return result;
  }
}

// ===================== Legacy Processor =====================
// The processFarmersFromApi function is kept for backward compatibility
// with the old processing logic. It will be deprecated in future releases.

export async function processFarmersFromApi() {
  let page = 1;
  let allFarmers = [];
  let hasMore = true;

  while (hasMore) {
    const apiResult = await getFarmers({ pageIndex: page, pageSize: 500 });
    if (!apiResult?.data?.length) break;
    allFarmers = allFarmers.concat(apiResult.data);
    page++;
    hasMore = apiResult.data.length === 500;
  }

  // Deduplicate by recId
  const uniqueFarmersMap = new Map();
  for (const farmer of allFarmers) {
    if (!uniqueFarmersMap.has(farmer.recId)) {
      uniqueFarmersMap.set(farmer.recId, farmer);
    }
  }
  const uniqueFarmers = Array.from(uniqueFarmersMap.values());

  // Bulk insert/update raw data (no reference code mapping)
  const result = await bulkInsertOrUpdateFarmers(uniqueFarmers);
  return result;
}
