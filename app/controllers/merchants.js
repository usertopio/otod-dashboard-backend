const { getMerchants } = require("../services/api/merchants.js");
const { insertMerchants } = require("../services/db/merchantsDb.js");
const MerchantsService = require("../services/merchants/merchantsService");
const { MERCHANTS_CONFIG } = require("../utils/constants");

exports.fetchMerchants = async (req, res) => {
  try {
    let totalRecords = 0;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    let allMerchantsAllPage = [];
    let allMerchantsCurPage = [];

    for (let page = 0; page < pages; page++) {
      let requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: pageSize,
      };

      let customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      let merchants = await getMerchants(requestBody, customHeaders);

      allMerchantsCurPage = merchants.data;

      allMerchantsAllPage = allMerchantsAllPage.concat(allMerchantsCurPage);

      allMerchantsCurPage.forEach(insertMerchants);

      console.log(
        `First 5 recId for page ${page + 1}:`,
        allMerchantsCurPage.slice(0, 5).map((f) => f.recId)
      );

      console.log(
        `Fetched data for page ${page + 1}: Length: ${
          allMerchantsCurPage.length
        }, Type: ${typeof allMerchantsCurPage}`
      );
    }

    res.json({
      allMerchantsAllPage: allMerchantsAllPage,
    });
  } catch (error) {
    console.error("Error fetching Merchants:", error);
    res.status(500).json({ error: "Failed to fetch Merchants" });
  }
};

const fetchMerchants = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || MERCHANTS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || MERCHANTS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchMerchants with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await MerchantsService.fetchMerchants(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchMerchants:", error);
    res.status(500).json({
      error: "Failed to fetch merchants data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchMerchants,
};
