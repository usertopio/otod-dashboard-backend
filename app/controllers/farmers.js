const { insertOrUpdateFarmer } = require("../services/db/farmersDb");
const { getFarmers } = require("../services/api/farmers");

// Controller function to fetch from API and save into DB
async function fetchFarmers(req, res) {
  try {
    // Detail provided by the outsource
    let totalRecords = 1114;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allFarmersAllPages = [];
    let allFarmersCurPage = [];
    let TotalemptyIdCardExpiryDateCurPage = 0;

    // Loop through the number of pages to fetch all farmer data
    for (let page = 1; page <= pages; page++) {
      // Prepare the request body for the API request
      let requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: 500,
      };

      // Custom headers for the API request
      let customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch farmers data in the current page from the outsource API
      let farmers = await getFarmers(requestBody, customHeaders);

      allFarmersCurPage = farmers.data;

      // Concatenate the fetched farmers from pages
      allFarmersAllPages = allFarmersAllPages.concat(allFarmersCurPage);

      // Insert farmers into the database one by one
      // Current (fire-and-forget)
      // allFarmersCurPage.forEach(insertOrUpdateFarmer);

      // Consider sequential processing for better error handling
      for (const farmer of allFarmersCurPage) {
        await insertOrUpdateFarmer(farmer);
      }

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allFarmersCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allFarmersCurPage.length
        }, Type: ${typeof allFarmersCurPage}`
      );
    }

    // ✅ Success response
    return res.status(200).json({
      message: "Farmers fetched and saved successfully",
      allFarmersAllPages: allFarmersAllPages,
    });
  } catch (err) {
    console.error("Error in fetchFarmers:", err);
    return res.status(500).json({ message: "Failed to fetch or save farmers" });
  }
}

module.exports = { fetchFarmers };
