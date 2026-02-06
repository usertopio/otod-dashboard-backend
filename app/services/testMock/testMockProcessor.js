// Processor for test mock data - handles fetching and transformation

import { getTestMockData } from "../api/testMock.js";
import { bulkInsertOrUpdateTestMock } from "../db/testMockDb.js";

export default class TestMockProcessor {
  /**
   * Fetch data from mock API with pagination
   * Returns all fetched data for validation before DB operations
   */
  static async fetchFromAPI(shouldFail = false) {
    let page = 1;
    let allData = [];
    let hasMore = true;
    const pageSize = 10;

    console.log(`📡 Fetching data from mock API...`);

    try {
      while (hasMore && page <= 3) {
        console.log(`📄 Fetching page ${page}...`);
        
        const apiResult = await getTestMockData({ 
          pageIndex: page, 
          pageSize: pageSize,
          shouldFail: shouldFail 
        });

        if (!apiResult?.data || apiResult.data.length === 0) {
          hasMore = false;
          break;
        }

        allData = allData.concat(apiResult.data);
        console.log(`   ✅ Page ${page}: ${apiResult.data.length} records`);
        
        hasMore = apiResult.data.length === pageSize;
        page++;
      }

      console.log(`📊 Total fetched from API: ${allData.length} records`);
      return { success: true, data: allData, count: allData.length };

    } catch (error) {
      console.error(`❌ API fetch failed:`, error.message);
      return { success: false, data: [], count: 0, error: error.message };
    }
  }

  /**
   * Process and deduplicate data
   */
  static deduplicateData(data) {
    const uniqueMap = new Map();
    
    for (const item of data) {
      if (item.recId && !uniqueMap.has(item.recId)) {
        uniqueMap.set(item.recId, item);
      }
    }

    const uniqueData = Array.from(uniqueMap.values());
    console.log(`🔗 Deduplication: ${data.length} → ${uniqueData.length} unique records`);
    
    return uniqueData;
  }

  /**
   * Insert processed data into database
   */
  static async insertToDatabase(data) {
    if (!data || data.length === 0) {
      return { inserted: 0, updated: 0, errors: 0, totalAfter: 0 };
    }

    console.log(`💾 Inserting ${data.length} records into database...`);
    const result = await bulkInsertOrUpdateTestMock(data);
    console.log(`✅ Database operation complete: ${result.inserted} inserted, ${result.updated} updated`);
    
    return result;
  }

  /**
   * Complete fetch and process workflow
   * NEW APPROACH: Returns data without inserting
   */
  static async fetchAndProcessData(shouldFail = false) {
    try {
      // Step 1: Fetch from API
      const fetchResult = await this.fetchFromAPI(shouldFail);
      
      if (!fetchResult.success) {
        return {
          success: false,
          inserted: 0,
          updated: 0,
          errors: 1,
          totalAfter: 0,
          error: fetchResult.error,
        };
      }

      // Step 2: Check if data exists
      if (fetchResult.count === 0) {
        return {
          success: false,
          inserted: 0,
          updated: 0,
          errors: 0,
          totalAfter: 0,
          noData: true,
        };
      }

      // Step 3: Deduplicate
      const uniqueData = this.deduplicateData(fetchResult.data);

      // Step 4: Return data for caller to decide next steps
      return {
        success: true,
        data: uniqueData,
        recordCount: uniqueData.length,
        readyToInsert: true,
      };

    } catch (error) {
      console.error("❌ Error in fetchAndProcessData:", error);
      return {
        success: false,
        inserted: 0,
        updated: 0,
        errors: 1,
        totalAfter: 0,
        error: error.message,
      };
    }
  }
}
