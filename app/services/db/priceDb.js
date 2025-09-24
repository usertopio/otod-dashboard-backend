import { connectionDB } from "../../config/db/db.conf.js";

const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
};

async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names || names.length === 0) return new Map();
  try {
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
        [names]
      );
    const codeMap = new Map();
    existing.forEach((row) => codeMap.set(row[nameColumn], row[codeColumn]));
    const missingNames = names.filter((name) => !codeMap.has(name));
    if (missingNames.length > 0) {
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
        );
      let nextNumber = 1;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0][codeColumn];
        nextNumber = parseInt(lastCode.replace(prefix, "")) + 1;
      }
      const insertData = missingNames.map((name, index) => {
        const code = `${prefix}${String(nextNumber + index).padStart(3, "0")}`;
        codeMap.set(name, code);
        return [code, name, "generated"];
      });
      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);
    }
    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
}

export async function bulkProcessReferenceCodes(avgPrices) {
  const provinces = [
    ...new Set(avgPrices.map((p) => p.province).filter(Boolean)),
  ];
  const breeds = [
    ...new Set(avgPrices.map((p) => p.breedName).filter(Boolean)),
  ];
  const [provinceCodes, breedCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinces,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_breeds",
      "breed_name", // name column
      "breed_id", // code column (FIXED: was 'breed_name')
      breeds,
      "GBREED"
    ),
  ]);
  return { provinceCodes, breedCodes };
}

export async function bulkInsertOrUpdateAvgPrice(avgPrices) {
  if (!avgPrices || avgPrices.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }
  try {
    const { provinceCodes, breedCodes } = await bulkProcessReferenceCodes(
      avgPrices
    );
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM price");
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
      INSERT INTO price (
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
      .query("SELECT COUNT(*) as count FROM price");
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
