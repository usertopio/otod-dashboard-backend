const {
  connectionDB,
  cropFields,
  cropHarvestFields,
} = require("../../config/db/crops.conf.js");

// Function to insert a crop into the database, one by one
const insertCrop = (crop) => {
  // Query to insert a crop into the database
  const insertCropsQuery = `
          INSERT INTO crops (${cropFields.join(", ")})
          VALUES (${cropFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted, handling empty date fields
  // by inserting null instead of an empty string
  const values = cropFields.map((cropField) => {
    if (
      (cropField === "gapIssuedDate" ||
        cropField === "gapExpiryDate" ||
        cropField === "cropStartDate" ||
        cropField === "cropEndDate") &&
      crop[cropField] === ""
    ) {
      return null;
    }
    return crop[cropField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCropsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

const insertCropHarvests = (cropHarvest) => {
  // Query to insert a CropHarvests into the database
  const insertCropHarvestsQuery = `
          INSERT INTO crop_harvests (${cropHarvestFields.join(", ")})
          VALUES (${cropHarvestFields.map(() => "?").join(", ")})`;

  // Prepare the values to be inserted
  const values = cropHarvestFields.map((cropHarvestField) => {
    return cropHarvest[cropHarvestField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCropHarvestsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

module.exports = {
  insertCrop,
  insertCropHarvests,
};
