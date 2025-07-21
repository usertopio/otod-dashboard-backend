const { getNews, getNewsSummaryByMonth } = require("../services/api/news.js");
const {
  insertANew,
  insertNewsSummaryByMonth,
} = require("../services/db/newsDb.js");

exports.fetchNews = async (req, res) => {
  try {
    // Detail provided by the outsource
    let totalRecords = 5;
    let pageSize = 500;
    let pages = Math.ceil(totalRecords / pageSize);

    // Initialize arrays to hold all farmers data and current page farmers data for logging
    let allNewsAllPages = [];
    let allNewsCurPage = [];
    // let TotalemptyIdCardExpiryDateCurPage = 0;

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        fromDate: "2024-10-01",
        toDate: "2024-12-31",
        pageIndex: 1,
        pageSize: 500,
      };

      // Custom headers for the API request
      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch crops data in the current page from the outsource API
      const news = await getNews(requestBody, customHeaders);

      allNewsCurPage = news.data;

      // Concatinate the fetched crops from pages
      allNewsAllPages = allNewsAllPages.concat(allNewsCurPage);

      // Insert a news into the database one by one
      allNewsCurPage.forEach(insertANew);

      // Log: Log the first 5 recId for the current page
      console.log(
        `First 5 recId for page ${page}:`,
        allNewsCurPage.slice(0, 5).map((f) => f.recId)
      );

      // Log: Log the fetched data for each page
      console.log(
        `Fetched data for page ${page}: Length: ${
          allNewsCurPage.length
        }, Type: ${typeof allNewsCurPage}`
      );
    }

    res.json({ allNewsAllPages: allNewsAllPages });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};

exports.fetchNewsSummaryByMonth = async (req, res) => {
  try {
    let requestBody = {
      fromYear: 2024,
      toYear: 2024,
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch news summary from the outsource API
    let newsSummaryByMonth = await getNewsSummaryByMonth(
      requestBody,
      customHeaders
    );

    // Insert the crop summary into the database one by one
    newsSummaryByMonth.data.forEach(insertNewsSummaryByMonth);

    res.json({ newsSummaryByMonth: newsSummaryByMonth.data });
  } catch (error) {
    console.error("Error fetching NewsSummaryByMonth:", error);
    res.status(500).json({ error: "Failed to fetch NewsSummaryByMonth" });
  }
};
