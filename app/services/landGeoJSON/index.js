const { getLandGeoJSON } = require("../api/landGeoJSON.js");
const transformLandGeoJSON = require("../transform/landGeoJSONTransform.js");

module.exports = async function runLandGeoJSON() {
  try {
    // Prepare the request body for the API request
    let requestBody = {
      province: "",
      amphur: "",
      tambon: "",
      landType: "",
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    const landGeoJSON = await getLandGeoJSON(requestBody, customHeaders);

    if (!landGeoJSON.farmers || landGeoJSON.farmers.length === 0) {
      console.log("⚠️ No farmers found.");
      return;
    }

    await transformLandGeoJSON(landGeoJSON.farmers);
    console.log("✅ LandGeoJSON completed.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};
