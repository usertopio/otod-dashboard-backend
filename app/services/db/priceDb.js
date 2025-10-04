import { connectionDB } from "../../config/db/db.conf.js";

const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
};

export async function bulkInsertOrUpdateAvgPrice(avgPrices) {
  if (!avgPrices || avgPrices.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }
  try {
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM avg_price");
    const beforeCount = countBefore[0].count;
    const bangkokTime = getBangkokTime();
    const avgPriceData = avgPrices.map((price) => [
      price.appPriceId,
      price.province ?? null,
      price.region ?? null,
      price.breedName ?? null,
      price.priceDate ?? null,
      price.avgPrice ?? null,
      price.dataSource ?? null,
      bangkokTime,
    ]);
    const sql = `
      INSERT INTO avg_price (
        app_price_id, province, region, breed_name, price_date, avg_price, data_source, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        province = VALUES(province),
        region = VALUES(region),
        breed_name = VALUES(breed_name),
        price_date = VALUES(price_date),
        avg_price = VALUES(avg_price),
        data_source = VALUES(data_source),
        fetch_at = VALUES(fetch_at)
    `;
    const [result] = await connectionDB.promise().query(sql, [avgPriceData]);
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM avg_price");
    const afterCount = countAfter[0].count;
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = avgPrices.length - actualInserts;
    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      totalProcessed: avgPrices.length,
    };
  } catch (err) {
    console.error("Bulk avg_price insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: avgPrices.length,
      totalProcessed: avgPrices.length,
      error: err.message,
    };
  }
}
