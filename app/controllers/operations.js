const { getOperations } = require("../services/api/operations.js");
const { insertOperations } = require("../services/db/operationsDb.js");
const OperationsService = require("../services/operations/operationsService");
const { OPERATIONS_CONFIG } = require("../utils/constants");

const fetchOperations = async (req, res) => {
  try {
    const targetCount =
      (req.body && req.body.targetCount) ||
      OPERATIONS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchOperations with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await OperationsService.fetchOperations(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchOperations:", error);
    res.status(500).json({
      error: "Failed to fetch operations data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchOperations,
};
