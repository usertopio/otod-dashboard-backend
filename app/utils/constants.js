const FARMERS_CONFIG = {
  DEFAULT_TARGET_COUNT: 1114,
  DEFAULT_MAX_ATTEMPTS: 10,
  DEFAULT_PAGE_SIZE: 500,
  DEFAULT_TOTAL_RECORDS: 1114,
};

// 🆕 NEW: Communities configuration
const COMMUNITIES_CONFIG = {
  DEFAULT_TARGET_COUNT: 3,
  DEFAULT_MAX_ATTEMPTS: 5,
  DEFAULT_PAGE_SIZE: 500,
  DEFAULT_TOTAL_RECORDS: 3,
};

// 🆕 ADD: News configuration constants
const NEWS_CONFIG = {
  DEFAULT_TARGET_COUNT: 5, // Based on your #news.js totalRecords = 5
  DEFAULT_MAX_ATTEMPTS: 5,
  PAGE_SIZE: 500,
  TOTAL_RECORDS: 5,
};

const STATUS = {
  SUCCESS: "SUCCESS",
  INCOMPLETE: "INCOMPLETE",
};

const OPERATIONS = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  ERROR: "ERROR",
};

module.exports = {
  FARMERS_CONFIG,
  NEWS_CONFIG, // 🆕 Export news config
  COMMUNITIES_CONFIG, // 🆕 Export communities config
  STATUS,
  OPERATIONS,
};
