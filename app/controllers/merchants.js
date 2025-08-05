const { getMerchants } = require("../services/api/merchants.js");
const { insertMerchants } = require("../services/db/merchantsDb.js");
const MerchantsService = require("../services/merchants/merchantsService");
const { MERCHANTS_CONFIG } = require("../utils/constants");

exports.fetchMerchants = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 0;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allMerchantsAllPage = [];
    let allMerchantsCurPage = [];

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

      // Fetch merchants data in the current page from the outsource API
      let merchants = await getMerchants(requestBody, customHeaders);

      allMerchantsCurPage = merchants.data;

      // Concatinate the fetched lands from pages
      allMerchantsAllPage = allMerchantsAllPage.concat(allMerchantsCurPage);

      // Insert a merchants into the database one by one
      allMerchantsCurPage.forEach(insertMerchants);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page + 1}:`,
        allMerchantsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page + 1}: Length: ${
          allMerchantsCurPage.length
        }, Type: ${typeof allMerchantsCurPage}`
      );
    }

    // Respond with all land data
    res.json({
      allMerchantsAllPage: allMerchantsAllPage,
    });
  } catch (error) {
    console.error("Error fetching Merchants:", error);
    res.status(500).json({ error: "Failed to fetch Merchants" });
  }
};

const fetchMerchantsUntilTarget = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || MERCHANTS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || MERCHANTS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchMerchantsUntilTarget with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await MerchantsService.fetchMerchantsUntilTarget(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchMerchantsUntilTarget:", error);
    res.status(500).json({
      error: "Failed to fetch merchants data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchMerchantsUntilTarget,
};
