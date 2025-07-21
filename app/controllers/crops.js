const {
  getCrops,
  getCropSummary,
  getGapSummary,
  getCropStageSummary,
  getCropHarvests,
  getCropForecastAndYield,
} = require("../services/api/crops.js");
const {
  insertCrop,
  insertCropSummary,
  insertGapSummary,
  insertCropStageSummary,
  insertCropHarvests,
  insertCropForecastAndYield,
} = require("../services/db/cropsDb");

exports.fetchCrops = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 518;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allCropsAllPages = [];
    let allCropsCurPage = [];
    // let TotalemptyIdCardExpiryDateCurPage = 0;

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        cropYear: 2024,
        provinceName: "",
        pageIndex: page,
        pageSize: 500,
      };

      // Custom headers for the API request
      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch crops data in the current page from the outsource API
      const crops = await getCrops(requestBody, customHeaders);

      allCropsCurPage = crops.data;

      // Concatinate the fetched crops from pages
      allCropsAllPages = allCropsAllPages.concat(allCropsCurPage);

      // Insert a crop into the database one by one
      allCropsCurPage.forEach(insertCrop);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allCropsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allCropsCurPage.length
        }, Type: ${typeof allCropsCurPage}`
      );
    }

    res.json({ allCropsAllPages: allCropsAllPages });
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
};

exports.fetchCropSummary = async (req, res) => {
  try {
    let requestBody = {
      cropYear: 2024,
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch crop summary from the outsource API
    let cropSummary = await getCropSummary(requestBody, customHeaders);

    // Insert the crop summary into the database one by one
    cropSummary.data.forEach(insertCropSummary);

    res.json({ cropSummary: cropSummary.data });
  } catch (error) {
    console.error("Error fetching crop summary:", error);
    res.status(500).json({ error: "Failed to fetch crop summary" });
  }
};

exports.fetchGapSummary = async (req, res) => {
  try {
    let requestBody = {
      cropYear: 2024,
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch grap summary from the outsource API
    let gapSummary = await getGapSummary(requestBody, customHeaders);

    // Insert the grap summary into the database one by one
    gapSummary.data.forEach(insertGapSummary);

    res.json({ gapSummary: gapSummary });
  } catch (error) {
    console.error("Error fetching crop summary:", error);
    res.status(500).json({ error: "Failed to fetch crop summary" });
  }
};

exports.fetchCropStageSummary = async (req, res) => {
  try {
    let requestBody = {
      cropYear: 2024,
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch crop stage summary from the outsource API
    let cropStageSummary = await getCropStageSummary(
      requestBody,
      customHeaders
    );

    // Insert the crop stage summary into the database one by one
    cropStageSummary.data.forEach(insertCropStageSummary);

    res.json({ cropStageSummary: cropStageSummary });
  } catch (error) {
    console.error("Error fetching crop stage summary:", error);
    res.status(500).json({ error: "Failed to fetch crop stage summary" });
  }
};

exports.fetchCropHarvests = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 0;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allCropHarvestsAllPage = [];
    let allCropHarvestsCurPage = [];

    // Loop through the number of pages to fetch all land data
    for (let page = 0; page <= pages; page++) {
      // Prepare the request body for the API request
      let requestBody = {
        cropYear: 2024,
        provinceName: "",
        fromDate: "2024-09-01",
        toDate: "2024-12-31",
        pageIndex: page,
        pageSize: pageSize,
      };

      // Custom headers for the API request
      let customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch CropHarvests in the current page from the outsource API
      let cropHarvests = await getCropHarvests(requestBody, customHeaders);

      allCropHarvestsCurPage = cropHarvests.data;

      // Concatinate the fetched lands from pages
      allCropHarvestsAllPage = allCropHarvestsAllPage.concat(
        allCropHarvestsCurPage
      );

      // Insert a CropHarvests into the database one by one
      allCropHarvestsCurPage.forEach(insertCropHarvests);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allCropHarvestsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allCropHarvestsCurPage.length
        }, Type: ${typeof allCropHarvestsCurPage}`
      );
    }

    // Respond with all land data
    res.json({
      allCropHarvestsAllPage: allCropHarvestsAllPage,
    });
  } catch (error) {
    console.error("Error fetching CropHarvests:", error);
    res.status(500).json({ error: "Failed to fetch CropHarvests" });
  }
};

exports.fetchCropForecastAndYield = async (req, res) => {
  try {
    let requestBody = {
      cropYear: 2024,
      provinceName: "",
      groupByBreed: true,
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch grap summary from the outsource API
    let cropForecastAndYield = await getCropForecastAndYield(
      requestBody,
      customHeaders
    );

    // Insert the grap summary into the database one by one
    cropForecastAndYield.data.forEach(insertCropForecastAndYield);

    res.json({ cropForecastAndYield: cropForecastAndYield });
  } catch (error) {
    console.error("Error fetching CropForecastAndYield:", error);
    res.status(500).json({ error: "Failed to fetch CropForecastAndYield" });
  }
};
