const { getFarmers } = require("../services/outsourceApi");

exports.fetchFarmers = async (req, res) => {
  try {
    req.body = {
      provinceName: "",
      pageIndex: 1,
      pageSize: 500,
    };
    const data = await getFarmers(req.body);
    res.json(data);
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
};
