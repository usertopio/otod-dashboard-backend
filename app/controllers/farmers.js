const { getFarmers, GetFarmerSummary } = require("../services/api/farmers.js");
const {
  insertFarmer,
  insertFarmerSummary,
} = require("../services/db/farmersDb");

// Function to fetch farmers data from the outsource API
exports.fetchFarmers = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 1114;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);
    // let pages = 3;
    let allFarmersAllPages = [];
    let allFarmersCurPage = [];
    let TotalemptyIdCardExpiryDateCurPage = 0;

    // Loop through the number of pages to fetch all farmaer data
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

      // Count the number of farmers with empty ID card expiry date in the current page
      TotalemptyIdCardExpiryDateCurPage = allFarmersCurPage.filter(
        (Farmer) => Farmer.idCardExpiryDate === ""
      ).length;

      // Concatinate the fetched farmers from pages
      allFarmersAllPages = allFarmersAllPages.concat(allFarmersCurPage);

      // Log: Log the fetched farmers
      console.log("Farmers:", allFarmersAllPages);
      console.log("Type:", typeof allFarmersAllPages);

      // Insert a farmer into the database one by one
      allFarmersCurPage.forEach(insertFarmer);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allFarmersCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allFarmersCurPage.length
        }, Type: ${typeof allFarmersCurPage}, Empty ID Card Expiry Date Count: ${TotalemptyIdCardExpiryDateCurPage}`
      );
    }

    // Respond with all farmer data
    res.json({
      allFarmersAllPages: allFarmersAllPages,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
};

exports.fetchFarmerSummary = async (req, res) => {
  try {
    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch farmer summary from the outsource API
    let farmerSummary = await GetFarmerSummary(customHeaders);

    // Log: Log the fetched farmer summary
    console.log("Farmer Summary:", farmerSummary);
    console.log("Type:", typeof farmerSummary);

    // Insert the farmer summary into the database one by one
    farmerSummary.data.forEach(insertFarmerSummary);

    res.json({ farmerSummary: farmerSummary });
  } catch (error) {
    console.error("Error fetching farmer summary:", error);
    res.status(500).json({ error: "Failed to fetch farmer summary" });
  }
};
