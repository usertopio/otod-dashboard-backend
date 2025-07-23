const { insertLandGeoJSON } = require("../db/landGeoJSONDb");

module.exports = async function transformLandGeoJSON(farmers) {
  const fetchedAt = new Date();

  for (const farmer of farmers) {
    const farmerId = farmer.farmerId;

    for (const land of farmer.lands || []) {
      insertLandGeoJSON({
        landId: land.landId,
        farmerId,
        landType: land.landType,
        lat: land.lat,
        lon: land.lon,
        areaRai: land.noOfRais,
        areaNgan: land.noOfNgan,
        areaWah: land.noOfWah,
        geojson: land.geojson,
        fetchedAt,
      });
    }
  }
};
