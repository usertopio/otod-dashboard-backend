const { getLandGeoJSON } = require("./api");
const transformLandGeoJSON = require("./transform");

module.exports = async function runLandGeoJSON() {
  try {
    const data = await getLandGeoJSON();

    if (!data.farmers || data.farmers.length === 0) {
      console.log("⚠️ No farmers found.");
      return;
    }

    await transformLandGeoJSON(data.farmers);
    console.log("✅ LandGeoJSON completed.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};
