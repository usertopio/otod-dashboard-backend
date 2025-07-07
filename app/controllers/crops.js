const { getCrops } = require("../services/api/crops.js");
const { insertCrop } = require("../services/db/cropsDb");

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
