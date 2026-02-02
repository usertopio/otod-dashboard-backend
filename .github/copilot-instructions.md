# OTOD Dashboard Backend - AI Coding Agent Instructions

## Project Overview
Backend service for OTOD Durian Dashboard that syncs data from National Agriculture Platform (NAP) APIs to AWS MySQL, serving Power BI dashboards for Digital Economy Promotion Agency (depa). Built with Express.js (ES modules), scheduled data fetching, and modular service architecture.

## Architecture Pattern: Service-Oriented Layered Structure

### Core Data Flow (Routes → Controllers → Services → DB)
```
routes/         → Defines API endpoints (POST /api/fetchX)
controllers/    → Thin HTTP handlers, delegates to services
services/       → Business logic organized by domain
  ├── {domain}/
  │   ├── {domain}Service.js     → Orchestration & public interface
  │   ├── {domain}Processor.js   → Data fetching, transformation, deduplication
  │   └── {domain}Logger.js      → Domain-specific logging utilities
  ├── api/        → External API client wrappers
  └── db/         → Database operations (bulk upserts)
```

**Example**: Communities domain implements this pattern across [routes/communities.js](../app/routes/communities.js), [controllers/communitiesCon.js](../app/controllers/communitiesCon.js), [services/communities/](../app/services/communities/), [services/api/communities.js](../app/services/api/communities.js), [services/db/communitiesDb.js](../app/services/db/communitiesDb.js).

### Key Architectural Decisions
- **Service-Processor-Logger Trio**: Each domain (farmers, crops, merchants, etc.) follows this 3-file pattern for separation of concerns
- **Bulk Upserts**: All DB operations use `INSERT ... ON DUPLICATE KEY UPDATE` for efficiency (see [services/db/communitiesDb.js](../app/services/db/communitiesDb.js))
- **Centralized Token Management**: [utils/tokenManager.js](../app/utils/tokenManager.js) handles JWT lifecycle with auto-refresh via [apiClient.js](../app/services/api/apiClient.js) interceptors
- **Cron-Based Sync**: [scheduler/cronService.js](../app/services/scheduler/cronService.js) orchestrates scheduled fetches for all domains (configurable via [utils/cronUtils.js](../app/utils/cronUtils.js))
- **Bangkok Timezone**: All timestamps use `Asia/Bangkok` timezone explicitly

## Critical Workflows

### Adding a New Domain
1. Create service trio: `services/{domain}/{domain}Service.js`, `{domain}Processor.js`, `{domain}Logger.js`
2. Add API wrapper: `services/api/{domain}.js` using `apiClient.post()`
3. Add DB operations: `services/db/{domain}Db.js` with bulk upsert pattern
4. Wire up: `routes/{domain}.js` → `controllers/{domain}Con.js`
5. Register in [scheduler/cronService.js](../app/services/scheduler/cronService.js) (see `runScheduledFetch()` steps array)
6. Add config to [utils/constants.js](../app/utils/constants.js) (e.g., `{DOMAIN}_CONFIG`)

### Running the Application
```powershell
# Local development (nodemon auto-restart)
npm start

# Docker (production-like)
docker compose up --build -d
```
- Ensure `.env` matches your environment (localhost vs Docker DB connection)
- Server auto-loads all routes from `app/routes/` via dynamic import in [server.js](../server.js)

### Manual Data Fetch
POST requests trigger immediate sync (bypassing cron):
```http
POST http://localhost:3000/api/fetchCommunities
POST http://localhost:3000/api/fetchFarmers
# etc. (see all routes in app/routes/)
```

## Project-Specific Conventions

### ES Modules Everywhere
- All imports use `.js` extensions: `import X from './file.js'`
- Use `export default class` or named exports
- Dynamic imports in loops: `await import(\`./routes/${file}\`)`

### Error Handling Pattern
Services return result objects, not thrown errors:
```javascript
return {
  inserted: 10,
  updated: 5,
  errors: 0,
  totalAfter: 15
}
```
Controllers wrap service calls in try-catch for HTTP responses.

### Logging Style
- Emojis for visual scanning: `🔄` (start), `✅` (success), `❌` (error), `🚦` (API call)
- Structured logs: `console.log("🔄 Step 1/3: Fetching...")`
- Timestamp format: `YYYY-MM-DD HH:MM:SS` (ISO but space-separated)

### Database Conventions
- All tables use snake_case columns (`rec_id`, `fetch_at`)
- Every record tracks `fetch_at` timestamp (Bangkok timezone)
- Unique keys for upserts (e.g., `rec_id` for communities)
- Connection pooling via `mysql2` (max 10 connections)

### API Integration
- Base URL from `process.env.OUTSOURCE_API_BASE_URL`
- All external calls go through [apiClient.js](../app/services/api/apiClient.js) (axios wrapper)
- Token auto-refresh on 401 responses
- Standard request body: `{ pageIndex: 1, pageSize: 500 }`

## Domain-Specific Patterns

### Paginated Data Fetching
See [communitiesProcessor.js](../app/services/communities/communitiesProcessor.js):
```javascript
let page = 1;
let allData = [];
while (hasMore) {
  const apiResult = await getAPIData({ pageIndex: page, pageSize: 500 });
  if (!apiResult?.data?.length) break;
  allData = allData.concat(apiResult.data);
  page++;
  hasMore = apiResult.data.length === 500;
}
```

### Deduplication Before DB Insert
Always dedupe by unique key (e.g., `recId`) using Map:
```javascript
const uniqueMap = new Map();
for (const item of allItems) {
  if (item.recId && !uniqueMap.has(item.recId)) {
    uniqueMap.set(item.recId, item);
  }
}
return Array.from(uniqueMap.values());
```

### Cron Schedule Configuration
Edit [cronUtils.js](../app/utils/cronUtils.js) for schedule changes. Default: every 2 minutes (dev), production should use daily at 5 AM:
```javascript
SCHEDULE_2: "0 0 5 * * *"  // 5 AM daily (cron syntax)
```

## API Endpoints & Database Mapping

### NAP API Endpoints (External)
All endpoints use base URL: `process.env.OUTSOURCE_API_BASE_URL`

| API Endpoint | Purpose | Database Table | Key Fields |
|--------------|---------|----------------|------------|
| `POST /api/JWT/Login` | Authentication | N/A | Returns JWT token |
| `POST /api/report/GetFarmers` | Fetch farmer records | `farmers` | rec_id, farmer_id, first_name, last_name |
| `POST /api/report/GetCommunities` | Fetch community data | `communities` | rec_id, comm_id, comm_name |
| `POST /api/report/GetLands` | Fetch land plots | `durian_gardens` | land_id, farmer_id, no_of_rais |
| `POST /api/report/GetCrops` | Fetch crop data | `crops` | crop_id, land_id, crop_year |
| `POST /api/report/GetCropHarvests` | Fetch harvest records | `crops` (merged) | yield_kg, harvested_year |
| `POST /api/report/GetMerchants` | Fetch merchant info | `merchants` | rec_id, merchant_id, merchant_name |
| `POST /api/report/GetOperations` | Fetch farm operations | `operations` | oper_id, crop_id, oper_date |
| `POST /api/report/GetWaterUsageSummaryByMonth` | Water usage stats | `water` | crop_year, province, total_litre |
| `POST /api/report/GetSubstanceUsageSummaryByMonth` | Substance usage | `substance` | crop_year, province, substance |
| `POST /api/report/GetNews` | Fetch news articles | `news` | rec_id, title, publish_date |
| `POST /api/report/GetAvgPriceByDate` | Price data | `avg_price` | price_date, variety_name, avg_price |

### Standard Request Format
```javascript
{
  pageIndex: 1,      // Page number (1-based)
  pageSize: 500      // Records per page
}
```

### Data Transformations

#### Field Name Mapping (API → Database)
- **CamelCase to snake_case**: `recId` → `rec_id`, `farmerId` → `farmer_id`
- **Location fields**: `amphur` → `district`, `tambon` → `subdistrict`
- **Dates**: API ISO strings → MySQL DATE/DATETIME with Bangkok timezone
- **Month format**: `operMonth: "2024-01"` → `oper_month: "2024-01-01"` (add day)

#### Special Processing

1. **Farmers Table**
   - Nullable fields: `title`, `gender`, `dateOfBirth`, `email`, `lineId`
   - Required: `recId`, `firstName`, `lastName`, `idCard`, `mobileNo`

2. **Crops Table** (Complex)
   - **Validation**: Checks if `land_id` exists in `durian_gardens` before insert
   - **Merge logic**: Combines `GetCrops` and `GetCropHarvests` API responses
   - **Skips invalid**: Crops with non-existent land_id are filtered out

3. **Operations Table**
   - **Validation**: Checks if `crop_id` exists in `crops` table
   - **Foreign key enforcement**: Only inserts operations for valid crops

4. **GAP Certificates**
   - **Validation**: Checks if `land_id` exists in `durian_gardens`
   - **Date parsing**: Handles `cert_date` and `expired_date` conversion

5. **Merchants Table**
   - **Reference codes**: Auto-generates codes for new provinces/districts/subdistricts
   - **Lookup tables**: Uses `ref_province`, `ref_district`, `ref_subdistrict`
   - **Code format**: `P001`, `D001`, `SD001` (3-digit padded)

6. **Price Table**
   - **Reference data**: Auto-generates variety codes and market codes
   - **Tables**: `ref_variety` (durian varieties), `ref_market` (market locations)

#### Timestamp Handling
All records get `fetch_at` timestamp in Bangkok timezone:
```javascript
const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
};
```

#### Bulk Upsert Pattern
All DB operations use `INSERT ... ON DUPLICATE KEY UPDATE`:
- **Insert**: If `rec_id`/unique key doesn't exist
- **Update**: If record exists, update all fields + `fetch_at`
- **Unique keys**: `rec_id`, `crop_id`, `land_id`, composite keys (year+province+month)

### Data Flow Summary
```
NAP API → Processor (fetch pages) → Dedupe by unique key → DB Layer (bulk upsert) → MySQL
         ↓                         ↓                       ↓
    Error handling          Validation checks       Reference table lookups
```

## Important Files Reference
- [server.js](../server.js) - Entry point, dynamic route loading, cron initialization
- [utils/constants.js](../app/utils/constants.js) - All domain configs (page sizes, date ranges)
- [utils/tokenManager.js](../app/utils/tokenManager.js) - JWT lifecycle management
- [scheduler/cronService.js](../app/services/scheduler/cronService.js) - Orchestrates all scheduled syncs
- [config/db/db.conf.js](../app/config/db/db.conf.js) - MySQL connection pool setup

## Dependencies & Versioning
- **Node >=16.0.0** (ES modules support)
- Key packages: `express@5.x`, `mysql2`, `axios`, `node-cron`, `nodemon`
- Uses `standard-version` for semantic versioning (see `npm run release`)
