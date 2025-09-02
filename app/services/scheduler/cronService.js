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
      console.log("📊 Starting 3-minute data fetch...");
      const startTime = Date.now();

      // Fetch all data types with lower attempt limits (since it runs frequently)
      const results = await Promise.allSettled([
        FarmersService.fetchAllFarmers(3),
        DurianGardensService.fetchAllDurianGardens(3),
        CropsService.fetchAllCrops(3),
        CommunitiesService.fetchAllCommunities(3),
        MerchantsService.fetchAllMerchants(3),
        OperationsService.fetchAllOperations(3),
        SubstanceService.fetchAllSubstance(3),
        WaterService.fetchAllWater(3),
        NewsService.fetchAllNews(3),
        GapService.fetchAllGap(3),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Log results
      console.log("📈 3-minute fetch completed in", duration, "seconds");

      const modules = [
        "Crops",
        "Farmers",
        "Merchants",
        "Communities",
        "DurianGardens",
        "Water",
        "Substance",
        "GAP",
        "News",
        "Operations",
      ];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`✅ ${modules[index]}: Success`);
        } else {
          console.log(`❌ ${modules[index]}: Failed -`, result.reason?.message);
        }
      });
    } catch (error) {
      console.error("❌ 3-minute data fetch failed:", error.message);
    }
  }

  // Manual trigger method (for testing)
  static async triggerManualFetch() {
    console.log("🚀 Manually triggering 3-minute fetch...");
    await this.runEvery3MinutesFetch();
  }
}

module.exports = CronService;
