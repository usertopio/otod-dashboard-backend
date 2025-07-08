const {
  getCommunities,
  getCommunitySummary,
} = require("../services/api/communities.js");
const {
  insertCommunities,
  insertCommunitySummary,
} = require("../services/db/communitiesDb.js");

exports.fetchCommunities = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 3;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allCommunitiesAllPage = [];
    let allCommunitiesCurPage = [];

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
      let Communities = await getCommunities(requestBody, customHeaders);

      allCommunitiesCurPage = Communities.data;

      // Concatinate the fetched lands from pages
      allCommunitiesAllPage = allCommunitiesAllPage.concat(
        allCommunitiesCurPage
      );

      // Insert a lands into the database one by one
      allCommunitiesCurPage.forEach(insertCommunities);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page + 1}:`,
        allCommunitiesCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page + 1}: Length: ${
          allCommunitiesCurPage.length
        }, Type: ${typeof allCommunitiesCurPage}`
      );
    }

    // Respond with all land data
    res.json({
      allCommunitiesAllPage: allCommunitiesAllPage,
    });
  } catch (error) {
    console.error("Error fetching Communities:", error);
    res.status(500).json({ error: "Failed to fetch Communities" });
  }
};

exports.fetchCommunitySummary = async (req, res) => {
  try {
    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch community summary from the outsource API
    let communitySummary = await getCommunitySummary(customHeaders);

    // Insert the community summary into the database one by one
    communitySummary.data.forEach(insertCommunitySummary);

    res.json({ communitySummary: communitySummary });
  } catch (error) {
    console.error("Error fetching CommunitySummary:", error);
    res.status(500).json({ error: "Failed to fetch CommunitySummary" });
  }
};
