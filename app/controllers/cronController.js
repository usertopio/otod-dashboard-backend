// controllers/cronController.js (ESM)
import CronService from "../services/scheduler/cronService.js";

/**
 * Manually trigger the 5-minute data fetch
 */
export async function triggerManualFetch(req, res) {
  try {
    await CronService.triggerManualFetch();
    res.status(200).json({
      message: "3-minute data fetch triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to trigger manual fetch",
      error: error.message,
    });
  }
}

/**
 * Get cron job status
 */
export async function getCronStatus(req, res) {
  try {
    res.status(200).json({
      message: "Cron service is running",
      schedule: "*/3 * * * * (Every 3 minutes)",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get cron status",
      error: error.message,
    });
  }
}
