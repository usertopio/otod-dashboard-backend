const {
  connectionDB,
  cropFields,
  cropSummaryFields,
  gapSummaryFields,
  cropStageSummaryFields,
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

// Function to insert a crop summary into the database, one by one
const insertCropSummary = (cropSummary) => {
  // Query to insert a crop summary into the database
  const insertCropSummaryQuery = `
    INSERT INTO crop_summary (${cropSummaryFields.join(", ")})
    VALUES (${cropSummaryFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = cropSummaryFields.map((cropSummaryField) => {
    return cropSummary[cropSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCropSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert CropSummary error:", err);
    }
  });
};

// Function to insert a GAP summary into the database, one by one
const insertGapSummary = (gapSummary) => {
  // Query to insert a GAP summary into the database
  const insertGapSummaryQuery = `
    INSERT INTO gap_summary (${gapSummaryFields.join(", ")})
    VALUES (${gapSummaryFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = gapSummaryFields.map((gapSummaryField) => {
    return gapSummary[gapSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertGapSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert GapSummary error:", err);
    }
  });
};

// Function to insert a crop stage summary into the database, one by one
const insertCropStageSummary = (cropStageSummary) => {
  // Query to insert a GAP summary into the database
  const insertCropStageSummaryQuery = `
    INSERT INTO crop_stage_summary (${cropStageSummaryFields.join(", ")})
    VALUES (${cropStageSummaryFields.map(() => "?").join(", ")})
  `;

  // Prepare the values to be inserted. Convert plain object to array
  const values = cropStageSummaryFields.map((cropStageSummaryField) => {
    return cropStageSummary[cropStageSummaryField];
  });

  // Execute the insert query with the prepared values
  connectionDB.query(insertCropStageSummaryQuery, values, (err) => {
    if (err) {
      console.error("Insert GapSummary error:", err);
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
  insertCropSummary,
  insertGapSummary,
  insertCropStageSummary,
  insertCropHarvests,
};
