const { connectionDB } = require("../../config/db/news.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 ADD: The missing reference lookup function
const convertNewsGroupNameToCode = async (newsGroupName) => {
  if (!newsGroupName) return null;

  try {
    // Check if news group already exists by name (exact match)
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT news_group_id FROM ref_news_groups WHERE news_group_name = ? LIMIT 1`,
        [newsGroupName]
      );

    if (existing.length > 0) {
      console.log(
        `✅ Found existing: "${newsGroupName}" → ${existing[0].news_group_id}`
      );
      return existing[0].news_group_id;
    } else {
      // 🔧 OPTIONAL: Manual mapping only if you want to force certain mappings
      const manualMapping = {
        // Uncomment if you want to force "ประกาศ" to map to existing NG002
        // 'ประกาศ': "NG002",
        // 'กิจกรรม': "NG003",
      };

      // Check manual mapping first (currently empty, so it will skip)
      if (manualMapping[newsGroupName]) {
        console.log(
          `📋 Manual mapping: "${newsGroupName}" → ${manualMapping[newsGroupName]}`
        );
        return manualMapping[newsGroupName];
      }

      // 🆕 Create new entry for unmatched API values
      console.log(`🔍 No exact match for "${newsGroupName}", creating new...`);

      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT news_group_id FROM ref_news_groups ORDER BY news_group_id DESC LIMIT 1`
        );

      let newGroupId;
      if (maxResult.length > 0) {
        const lastId = maxResult[0].news_group_id;
        const lastNumber = parseInt(lastId.replace("NG", ""));
        newGroupId = `NG${String(lastNumber + 1).padStart(3, "0")}`;
      } else {
        newGroupId = "NG001"; // Fallback if table is empty
      }

      // Insert new news group with exact API value
      await connectionDB.promise().query(
        `INSERT INTO ref_news_groups (news_group_id, news_group_name, source) 
         VALUES (?, ?, 'generated')`,
        [newGroupId, newsGroupName]
      );

      console.log(`🆕 Created new: ${newGroupId} = "${newsGroupName}"`);
      return newGroupId;
    }
  } catch (err) {
    console.error("News group lookup error:", err.message);
    return null;
  }
};

// 🎯 ONLY: Advanced insert/update pattern for fetchNewsUntilTarget
const insertOrUpdateNews = async (news) => {
  try {
    // Check if news already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM news WHERE rec_id = ? LIMIT 1`, [news.recId]);

    // 🔧 CRITICAL FIX: Actually call the reference lookup function
    const newsGroupCode = await convertNewsGroupNameToCode(news.newsGroup);
    console.log(`🔄 Converting "${news.newsGroup}" → "${newsGroupCode}"`);

    if (existing.length > 0) {
      // UPDATE existing news
      await connectionDB.promise().query(
        `UPDATE news SET 
         news_province_code = ?, 
         news_id = ?, 
         announce_date = ?, 
         news_group_id = ?, 
         news_topic = ?, 
         news_detail = ?, 
         no_of_like = ?, 
         no_of_comments = ?, 
         updated_at = NOW(),
         fetch_at = NOW()
         WHERE rec_id = ?`,
        [
          null,
          news.newsId,
          news.announceDate || null,
          newsGroupCode, // 🔧 FIXED: Use converted code
          news.newsTopic || null,
          news.newsDetail || null,
          news.noOfLike || null,
          news.noOfComments || null,
          news.recId,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: news.recId };
    } else {
      // INSERT new news
      await connectionDB.promise().query(
        `INSERT INTO news 
         (rec_id, news_province_code, news_id, announce_date, 
          news_group_id, news_topic, news_detail, no_of_like, 
          no_of_comments, created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), ?)`,
        [
          news.recId,
          null,
          news.newsId,
          news.announceDate || null,
          newsGroupCode, // 🔧 FIXED: Use converted code
          news.newsTopic || null,
          news.newsDetail || null,
          news.noOfLike || null,
          news.noOfComments || null,
          news.companyId || null,
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: news.recId };
    }
  } catch (err) {
    console.error("News insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: news.recId,
      error: err.message,
    };
  }
};

module.exports = {
  insertOrUpdateNews, // 🎯 ONLY: Export advanced function
};

// 🔧 REMOVED: Old simple functions
// insertANew, insertNewsSummaryByMonth
