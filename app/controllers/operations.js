const {
  getOperations,
  getOperationSummary,
} = require("../services/api/operations.js");
const {
  insertOperations,
  insertOperationSummary,
} = require("../services/db/operationsDb.js");

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

exports.fetchOperationSummary = async (req, res) => {
  try {
    // Prepare the request body for the API request
    let requestBody = {
      cropYear: 2024,
      provinceName: "",
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch operation summary from the outsource API (POST with empty body)
    let operationSummary = await getOperationSummary(
      requestBody,
      customHeaders
    );

    // Insert the community summary into the database one by one
    operationSummary.data.forEach(insertOperationSummary);

    res.json({ operationSummary: operationSummary.data });
  } catch (error) {
    console.error("Error fetching OperationSummary:", error);
    res.status(500).json({ error: "Failed to fetch OperationSummary" });
  }
};
