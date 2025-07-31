const { getLands } = require("../services/api/lands.js");
const { insertLand } = require("../services/db/landsDb");

exports.fetchLands = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 1143;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);
    // let pages = 3;

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allLandsAllPage = [];
    let allLandsCurPage = [];

    // Loop through the number of pages to fetch all land data
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

      // Fetch lands data in the current page from the outsource API
      let lands = await getLands(requestBody, customHeaders);

      allLandsCurPage = lands.data;

      // Concatinate the fetched lands from pages
      allLandsAllPage = allLandsAllPage.concat(allLandsCurPage);

      // Insert a lands into the database one by one
      allLandsCurPage.forEach(insertLand);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allLandsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allLandsCurPage.length
        }, Type: ${typeof allLandsCurPage}`
      );
    }

    // Respond with all land data
    res.json({
      allLandsAllPage: allLandsAllPage,
    });
  } catch (error) {
    console.error("Error fetching lands:", error);
    res.status(500).json({ error: "Failed to fetch lands" });
  }
};
