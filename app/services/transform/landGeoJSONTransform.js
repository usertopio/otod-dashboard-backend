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
        noOfRais: land.noOfRais,
        noOfNgan: land.noOfNgan,
        noOfWah: land.noOfWah,
        geojson: land.geojson,
        fetchedAt,
      });
    }
  }
};
