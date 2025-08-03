const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetNews
const getNews = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetNews", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = {
  getNews,
};
