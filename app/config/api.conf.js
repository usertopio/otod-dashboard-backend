module.exports = {
  baseURL: process.env.OUTSOURCE_API_URL,
  accessToken: process.env.ACCESS_TOKEN,
  headers: {
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
};
