// app/services/scheduler/cronService.js
const cron = require("node-cron");
const { SCHEDULES_CONFIG } = require("../../utils/cronUtils"); // Add this line
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
   * Get formatted timestamp
   */
  static getTimestamp() {
    return new Date().toISOString().replace("T", " ").substring(0, 19);
  }

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

    Object.values(SCHEDULES_CONFIG).forEach((schedule) => {
      if (!cron.validate(schedule)) {
        throw new Error(`Invalid cron schedule: ${schedule}`);
      }
    });

    // Single callback function to avoid duplication
    const scheduleCallback = async () => {
      if (this.isRunning) {
        console.log("⏳ Previous scheduled fetch still running - skipping");
        return;
      }

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      console.log(`🔄 Running scheduled data fetch at ${timeStr}...`);
      await this.runScheduledFetch();
    };

    // Schedule sessions with the same callback
    Object.values(SCHEDULES_CONFIG).forEach((schedule) => {
      cron.schedule(schedule, scheduleCallback, { timezone: "Asia/Bangkok" });
    });

    console.log(
      "✅ Scheduled tasks initialized: run every 6 minutes at second 0 (Asia/Bangkok)"
    );
  }

  static async runScheduledFetch() {
    if (this.isRunning) {
      console.log("🔒 Fetch already in progress - aborting");
      return;
    }

    this.isRunning = true;
    const startTimestamp = this.getTimestamp();
    console.log(`[${startTimestamp}] 🔒 Setting execution lock`);

    try {
      console.log(
        `[${startTimestamp}] 📊 Starting scheduled data fetch (Sequential)...`
      );
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
      const durationMinutes = (duration / 60).toFixed(2);
      const endTimestamp = this.getTimestamp();

      console.log("");
      console.log("==========================================");
      console.log("📊 FINAL SUMMARY:");
      console.log(
        `📈 Sequential fetch completed in ${duration} seconds (${durationMinutes} minutes)`
      );
      steps.forEach((s, i) => {
        const r = results[i];
        if (r?.status === "fulfilled") {
          console.log(`✅ ${s.name}: Success (${r.ms} ms)`);
        } else {
          console.log(`❌ ${s.name}: Failed - ${r?.reason?.message}`);
        }
      });
      console.log(`[${endTimestamp}] 🏁 Task completed successfully`);
    } catch (error) {
      const errorTimestamp = this.getTimestamp();
      console.error(
        `[${errorTimestamp}] ❌ Sequential data fetch failed:`,
        error.message
      );
    } finally {
      const finalTimestamp = this.getTimestamp();
      this.isRunning = false;
      console.log(`[${finalTimestamp}] 🔓 Released execution lock`);
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
    const timestamp = this.getTimestamp();
    console.log(`[${timestamp}] 🚀 Manually triggering scheduled fetch...`);
    await this.runScheduledFetch();
  }
}

module.exports = CronService;
