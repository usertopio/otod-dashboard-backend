const runLandGeoJSON = require("../services/landGeoJSON/index.js");

exports.fetchLandGeoJSON = async (req, res) => {
  try {
    await runLandGeoJSON();
    res.status(200).send("✅ GetLandGeoJSON processed successfully.");
  } catch (error) {
    console.error("❌ Controller error:", error.message);
    res.status(500).send("Error processing GetLandGeoJSON.");
  }
};
