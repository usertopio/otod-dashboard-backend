const { getFarmers } = require("../services/api/outsourceApi.js");
const { insertFarmers } = require("../services/db/farmersDb");

// Function to fetch farmers data from the outsource API
exports.fetchFarmers = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 1114;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);
    let allFarmers = [];

    // Loop through the number of pages to fetch all farmaer data
    for (let page = 1; page <= pages; page++) {
      let payload = {
        provinceName: "",
        pageIndex: page,
        pageSize: 500,
      };

      let Farmers = await getFarmers(payload);

      console.log(
        `Fetched data for round ${page}: ${Farmers.data}, Length: ${
          Farmers.data.length
        }, Type: ${typeof Farmers.data}`
      );

      allFarmers = allFarmers.concat(Farmers.data);

      // Insert farmer into the database one by one
      Farmers.data.forEach(insertFarmers);
    }

    res.json({ allFarmers: allFarmers });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
};
