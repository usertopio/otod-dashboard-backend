const { getLandGeoJSON } = require("../api/landGeoJSON.js");
const transformLandGeoJSON = require("../transform/landGeoJSONTransform.js");
const { insertLandGeoJSON } = require("../db/landGeoJSONDb.js");

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
      return { farmers: [] };
    }

    // Step 1: Transform data (pure transformation, no side effects)
    const transformedData = transformLandGeoJSON(landGeoJSON.farmers);

    // Step 2: Save to database (separate concern)
    try {
      for (const landData of transformedData) {
        await insertLandGeoJSON(landData);
      }
      console.log("✅ Data saved to database successfully");
    } catch (dbError) {
      console.error("⚠️ Database error (continuing anyway):", dbError.message);
    }

    console.log("✅ LandGeoJSON completed.");
    return landGeoJSON; // Return the original API data
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
};
