const runLandGeoJSON = require("../services/landGeoJSON/index.js");

exports.fetchLandGeoJSON = async (req, res) => {
  try {
    const result = await runLandGeoJSON();

    // Debug: Log the actual structure
    console.log("🔍 Result structure:", JSON.stringify(result, null, 2));
    console.log("🔍 Has farmers:", !!result?.farmers);
    console.log("🔍 Farmers count:", result?.farmers?.length || 0);

    if (result?.farmers) {
      result.farmers.forEach((farmer, index) => {
        console.log(`🔍 Farmer ${index}:`, Object.keys(farmer));
        console.log(`🔍 Farmer ${index} has lands:`, !!farmer.lands);
        console.log(
          `🔍 Farmer ${index} lands count:`,
          farmer.lands?.length || 0
        );
      });
    }

    if (!result || !result.farmers || result.farmers.length === 0) {
      return res.status(200).json({
        message: "No lands found",
        lands: [],
      });
    }

    // Transform the data to match your desired format
    const lands = [];
    result.farmers.forEach((farmer) => {
      console.log("🔍 Processing farmer:", farmer);

      if (farmer.lands && farmer.lands.length > 0) {
        farmer.lands.forEach((land) => {
          console.log("🔍 Processing land:", land);
          lands.push({
            landId: land.landId,
            landType: land.landType,
            lat: land.lat,
            lon: land.lon,
            noOfRais: land.noOfRais,
            noOfNgan: land.noOfNgan,
            noOfWah: land.noOfWah,
            geojson:
              typeof land.geojson === "string"
                ? land.geojson
                : JSON.stringify(land.geojson),
          });
        });
      } else {
        console.log("🔍 No lands found for farmer:", farmer);
      }
    });

    console.log("🔍 Final lands array:", lands.length);

    res.status(200).json({
      message: "Lands fetched successfully",
      lands: lands,
    });
  } catch (error) {
    console.error("❌ Controller error:", error.message);
    res.status(500).json({
      error: "Error processing GetLandGeoJSON",
      message: error.message,
    });
  }
};
