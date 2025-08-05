const { getOperations } = require("../services/api/operations.js");
const { insertOperations } = require("../services/db/operationsDb.js");
const OperationsService = require("../services/operations/operationsService");
const { OPERATIONS_CONFIG } = require("../utils/constants");

exports.fetchOperations = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 0;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allOperationsAllPage = [];
    let allOperationsCurPage = [];

    // Loop through the number of pages to fetch all land data
    for (let page = 0; page < pages; page++) {
      // Prepare the request body for the API request
      let requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: pageSize,
      };

      // Custom headers for the API request
      let customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch lands data in the current page from the outsource API
      let operations = await getOperations(requestBody, customHeaders);

      allOperationsCurPage = operations.data;

      // Concatinate the fetched lands from pages
      allOperationsAllPage = allOperationsAllPage.concat(allOperationsCurPage);

      // Insert a lands into the database one by one
      allOperationsCurPage.forEach(insertOperations);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page + 1}:`,
        allOperationsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page + 1}: Length: ${
          allOperationsCurPage.length
        }, Type: ${typeof allOperationsCurPage}`
      );
    }

    // Respond with all land data
    res.json({
      allOperationsAllPage: allOperationsAllPage,
    });
  } catch (error) {
    console.error("Error fetching Operations:", error);
    res.status(500).json({ error: "Failed to fetch Operations" });
  }
};

const fetchOperationsUntilTarget = async (req, res) => {
  try {
    const targetCount =
      (req.body && req.body.targetCount) ||
      OPERATIONS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchOperationsUntilTarget with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await OperationsService.fetchOperationsUntilTarget(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchOperationsUntilTarget:", error);
    res.status(500).json({
      error: "Failed to fetch operations data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchOperationsUntilTarget,
};
