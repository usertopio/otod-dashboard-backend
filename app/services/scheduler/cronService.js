// app/services/scheduler/cronService.js
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
  static isRunning = false;
  static _initialized = false; // guard for nodemon/double init

  /**
   * Run one step with uniform logging and error capture.
   * Pushes {status, value|reason, name, ms} into results.
   */
  static async runStep({ name, run }, index, total, results, retries = 0) {
    console.log(`🔄 Step ${index}/${total}: Fetching ${name}...`);
    const t0 = Date.now();
    try {
      const value = await run();
      const ms = Date.now() - t0;
      results.push({ status: "fulfilled", value, name, ms });
      console.log(`✅ ${name} completed (${ms} ms)`);
    } catch (err) {
      if (retries > 0) {
        console.log(
          `⚠️ ${name} failed: ${err?.message}. Retrying (${retries})...`
        );
        return this.runStep({ name, run }, index, total, results, retries - 1);
      }
      const ms = Date.now() - t0;
      results.push({ status: "rejected", reason: err, name, ms });
      console.log(`❌ ${name} failed: ${err?.message}`);
    }
  }

  static init() {
    if (this._initialized) {
      console.log("♻️ CronService already initialized. Skipping.");
      return;
    }
    this._initialized = true;

    console.log("🕐 Initializing scheduled tasks...");

    // ── Schedule: at second 0 of every minute ──
    const expr = "* * * * * *"; // sec min hr dom mon dow
    if (!cron.validate(expr)) {
      throw new Error(`Invalid cron expression: ${expr}`);
    }

    cron.schedule(
      expr,
      async () => {
        if (this.isRunning) {
          console.log("⏳ Previous 1-minute fetch still running - skipping");
          return;
        }

        console.log("🔄 Running 1-minute data fetch...");
        await this.runScheduledFetch();
      },
      { timezone: "Asia/Bangkok" }
    );

    console.log(
      "✅ Scheduled task initialized: Every 1 minute at :00 (Asia/Bangkok)"
    );

    // Optional: kick off once on startup (uncomment if you want immediate run)
    // this.runScheduledFetch().catch((e) =>
    //   console.error("❌ Startup fetch failed:", e.message)
    // );
  }

  static async runScheduledFetch() {
    if (this.isRunning) {
      console.log("🔒 Fetch already in progress - aborting");
      return;
    }

    this.isRunning = true;
    console.log("🔒 Setting execution lock");

    try {
      console.log("📊 Starting 1-minute data fetch (Sequential)...");
      const startTime = Date.now();

      const steps = [
        { name: "Farmers", run: () => FarmersService.fetchAllFarmers() },
        {
          name: "Durian Gardens",
          run: () => DurianGardensService.fetchAllDurianGardens(),
        },
        { name: "Crops", run: () => CropsService.fetchAllCrops() },
        {
          name: "Communities",
          run: () => CommunitiesService.fetchAllCommunities(),
        },
        { name: "Merchants", run: () => MerchantsService.fetchAllMerchants() },
        {
          name: "Operations",
          run: () => OperationsService.fetchAllOperations(),
        },
        { name: "Substance", run: () => SubstanceService.fetchAllSubstance() },
        { name: "Water", run: () => WaterService.fetchAllWater() },
        { name: "News", run: () => NewsService.fetchAllNews() },
        { name: "GAP", run: () => GapService.fetchAllGap() },
      ];

      const results = [];
      for (let i = 0; i < steps.length; i++) {
        // Set retries to 0 or 1 if you want a single retry on transient failures
        await this.runStep(
          steps[i],
          i + 1,
          steps.length,
          results,
          /*retries*/ 0
        );
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("");
      console.log("==========================================");
      console.log("📊 FINAL SUMMARY:");
      console.log(`📈 Sequential fetch completed in ${duration} seconds`);
      steps.forEach((s, i) => {
        const r = results[i];
        if (r?.status === "fulfilled") {
          console.log(`✅ ${s.name}: Success (${r.ms} ms)`);
        } else {
          console.log(`❌ ${s.name}: Failed - ${r?.reason?.message}`);
        }
      });
    } catch (error) {
      console.error("❌ Sequential data fetch failed:", error.message);
      console.log("==========================================");
      console.log("================END TASK==================");
      console.log("==========================================");
    } finally {
      this.isRunning = false;
      console.log("🔓 Released execution lock");
      console.log("==========================================");
      console.log("================END TASK==================");
      console.log("==========================================");
    }
  }

  // Manual trigger (for testing)
  static async triggerManualFetch() {
    if (this.isRunning) {
      console.log("⏳ Automated fetch is running - please wait");
      return;
    }
    console.log("🚀 Manually triggering 1-minute fetch...");
    await this.runScheduledFetch();
  }
}

module.exports = CronService;
