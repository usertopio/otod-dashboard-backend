const { getFarmers } = require("../services/api/outsourceApi.js");
const { insertFarmer } = require("../services/db/farmersDb");

// Function to fetch farmers data from the outsource API
exports.fetchFarmers = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 1114;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);
    let allFarmers = [];
    let TotalemptyIdCardExpiryDateCountPage = 0;

    // Loop through the number of pages to fetch all farmaer data
    for (let page = 1; page <= pages; page++) {
      // Prepare the payload for the API request
      let payload = {
        provinceName: "",
        pageIndex: page,
        pageSize: 500,
      };

      // Fetch farmers data from the outsource API
      let Farmers = await getFarmers(payload);

      TotalemptyIdCardExpiryDateCountPage = Farmers.data.filter(
        (Farmer) => Farmer.idCardExpiryDate === ""
      ).length;

      // Concatinate the fetched farmers from pages
      allFarmers = allFarmers.concat(Farmers.data);

      let emptyIdCardExpiryDateCount = 0;
      // Insert a farmer into the database one by one
      Farmers.data.forEach(insertFarmer);

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for round ${page}: Length: ${
          Farmers.data.length
        }, Type: ${typeof Farmers.data}, Empty ID Card Expiry Date Count: ${TotalemptyIdCardExpiryDateCountPage}`
      );
    }

    // Respond with all farmers data
    res.json({
      allFarmers: allFarmers,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
};
