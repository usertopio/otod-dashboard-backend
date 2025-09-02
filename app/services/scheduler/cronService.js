const cron = require("node-cron");
const CropsService = require("../crops/cropsService");
const FarmersService = require("../farmers/farmersService");
const MerchantsService = require("../merchants/merchantsService");
const CommunitiesService = require("../communities/communitiesService");
const DurianGardensService = require("../durianGardens/durianGardensService");
const WaterService = require("../water/waterService");
const SubstanceService = require("../substance/substanceService");
const GapService = require("../gap/gapService");
const NewsService = require("../news/newsService");
const OperationsService = require("../operations/operationsService");

class CronService {
  static init() {
    console.log("🕐 Initializing scheduled tasks...");

    // Every 3 minutes - fetch all data
    cron.schedule("*/3 * * * *", async () => {
      console.log("🔄 Running 3-minute data fetch...");
      await this.runEvery3MinutesFetch();
    });

    console.log("✅ Scheduled task initialized: Every 3 minutes");
  }

  static async runEvery3MinutesFetch() {
    try {
      console.log("📊 Starting 3-minute data fetch (Sequential)...");
      const startTime = Date.now();

      const results = [];
      const modules = [
        "Farmers",
        "DurianGardens",
        "Crops",
        "Communities",
        "Merchants",
        "Operations",
        "Substance",
        "Water",
        "News",
        "GAP",
      ];

      // Step 1: Farmers (required by durian gardens and crops)
      console.log("🔄 Step 1/10: Fetching farmers...");
      try {
        const farmersResult = await FarmersService.fetchAllFarmers();
        results.push({ status: "fulfilled", value: farmersResult });
        console.log("✅ Farmers completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Farmers failed:", error.message);
      }

      // Step 2: Durian Gardens (requires farmers)
      console.log("🔄 Step 2/10: Fetching durian gardens...");
      try {
        const gardensResult =
          await DurianGardensService.fetchAllDurianGardens();
        results.push({ status: "fulfilled", value: gardensResult });
        console.log("✅ Durian Gardens completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Durian Gardens failed:", error.message);
      }

      // Step 3: Crops (requires farmers and durian gardens)
      console.log("🔄 Step 3/10: Fetching crops...");
      try {
        const cropsResult = await CropsService.fetchAllCrops();
        results.push({ status: "fulfilled", value: cropsResult });
        console.log("✅ Crops completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Crops failed:", error.message);
      }

      // Step 4: Communities (independent)
      console.log("🔄 Step 4/10: Fetching communities...");
      try {
        const communitiesResult =
          await CommunitiesService.fetchAllCommunities();
        results.push({ status: "fulfilled", value: communitiesResult });
        console.log("✅ Communities completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Communities failed:", error.message);
      }

      // Step 5: Merchants (independent)
      console.log("🔄 Step 5/10: Fetching merchants...");
      try {
        const merchantsResult = await MerchantsService.fetchAllMerchants();
        results.push({ status: "fulfilled", value: merchantsResult });
        console.log("✅ Merchants completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Merchants failed:", error.message);
      }

      // Step 6: Operations (requires crops)
      console.log("🔄 Step 6/10: Fetching operations...");
      try {
        const operationsResult = await OperationsService.fetchAllOperations();
        results.push({ status: "fulfilled", value: operationsResult });
        console.log("✅ Operations completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Operations failed:", error.message);
      }

      // Step 7: Substance (independent)
      console.log("🔄 Step 7/10: Fetching substance...");
      try {
        const substanceResult = await SubstanceService.fetchAllSubstance();
        results.push({ status: "fulfilled", value: substanceResult });
        console.log("✅ Substance completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Substance failed:", error.message);
      }

      // Step 8: Water (independent)
      console.log("🔄 Step 8/10: Fetching water...");
      try {
        const waterResult = await WaterService.fetchAllWater();
        results.push({ status: "fulfilled", value: waterResult });
        console.log("✅ Water completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ Water failed:", error.message);
      }

      // Step 9: News (independent)
      console.log("🔄 Step 9/10: Fetching news...");
      try {
        const newsResult = await NewsService.fetchAllNews();
        results.push({ status: "fulfilled", value: newsResult });
        console.log("✅ News completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ News failed:", error.message);
      }

      // Step 10: GAP (independent)
      console.log("🔄 Step 10/10: Fetching GAP...");
      try {
        const gapResult = await GapService.fetchAllGap();
        results.push({ status: "fulfilled", value: gapResult });
        console.log("✅ GAP completed");
      } catch (error) {
        results.push({ status: "rejected", reason: error });
        console.log("❌ GAP failed:", error.message);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log("📈 Sequential fetch completed in", duration, "seconds");

      // Final summary
      console.log("📊 FINAL SUMMARY:");
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`✅ ${modules[index]}: Success`);
        } else {
          console.log(`❌ ${modules[index]}: Failed -`, result.reason?.message);
        }
      });
    } catch (error) {
      console.error("❌ Sequential data fetch failed:", error.message);
    }
  }

  // Manual trigger method (for testing)
  static async triggerManualFetch() {
    console.log("🚀 Manually triggering 3-minute fetch...");
    await this.runEvery3MinutesFetch();
  }
}

module.exports = CronService;
