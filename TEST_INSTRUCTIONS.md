# Test Mock Module - Instructions

This module demonstrates the difference between the OLD (dangerous) and NEW (safe) approaches to data fetching and table management.

## Setup

### 1. Create the test table in MySQL:
```bash
mysql -u root -p otod < test_mock_table.sql
```

Or manually run the SQL:
```sql
CREATE TABLE IF NOT EXISTS test_mock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rec_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255),
  description TEXT,
  status VARCHAR(50),
  created_at DATETIME,
  updated_at DATETIME,
  fetch_at DATETIME NOT NULL,
  INDEX idx_rec_id (rec_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial test data
INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES
('MOCK001', 'Test Record 1', 'Initial test data', 'active', NOW(), NOW(), NOW()),
('MOCK002', 'Test Record 2', 'Initial test data', 'active', NOW(), NOW(), NOW()),
('MOCK003', 'Test Record 3', 'Initial test data', 'inactive', NOW(), NOW(), NOW());
```

### 2. Start the server:
```bash
npm start
```

## Test Scenarios

### Test 1: NEW Approach - Success Scenario ✅
**Endpoint:** `POST http://localhost:3000/api/testNewApproachSuccess`

**Expected behavior:**
1. Fetches data from API first
2. Validates data exists
3. Only then truncates table
4. Inserts new data

**Expected result:** Success with new data inserted

---

### Test 2: NEW Approach - API Failure Scenario 🛡️
**Endpoint:** `POST http://localhost:3000/api/testNewApproachFail`

**Expected behavior:**
1. Attempts to fetch data from API
2. API fails (simulated error)
3. Table is NOT truncated
4. Old data is PRESERVED

**Expected result:**
```json
{
  "success": false,
  "oldDataPreserved": true,
  "dataLost": false,
  "message": "API fetch failed - table NOT truncated"
}
```

**Verify:** Check database - should still have 3 original records

---

### Test 3: OLD Approach - Success Scenario ⚠️
**Endpoint:** `POST http://localhost:3000/api/testOldApproachSuccess`

**Expected behavior:**
1. Truncates table FIRST (old data deleted)
2. Fetches data from API
3. Inserts new data

**Expected result:** Success but old data was still deleted

---

### Test 4: OLD Approach - API Failure Scenario 💥
**Endpoint:** `POST http://localhost:3000/api/testOldApproachFail`

**Expected behavior:**
1. Truncates table FIRST (old data deleted immediately)
2. Attempts to fetch from API
3. API fails
4. Table is now EMPTY - data lost!

**Expected result:**
```json
{
  "success": false,
  "oldDataPreserved": false,
  "dataLost": true,
  "lostRecords": 3,
  "message": "API fetch failed - table was already truncated"
}
```

**Verify:** Check database - should be EMPTY (0 records)

---

### Check Current Count
**Endpoint:** `GET http://localhost:3000/api/testMockCount`

Returns current number of records in test_mock table.

## Testing Sequence

### Sequence 1: Demonstrate NEW approach safety
```bash
# 1. Check initial count (should be 3)
curl http://localhost:3000/api/testMockCount

# 2. Test NEW approach with API failure
curl -X POST http://localhost:3000/api/testNewApproachFail

# 3. Check count again (should STILL be 3 - data preserved!)
curl http://localhost:3000/api/testMockCount

# 4. Test NEW approach with success
curl -X POST http://localhost:3000/api/testNewApproachSuccess

# 5. Check count (should have new records)
curl http://localhost:3000/api/testMockCount
```

### Sequence 2: Demonstrate OLD approach danger
```bash
# 1. Reset to initial data (3 records)
mysql -u root -p otod -e "DELETE FROM test_mock; INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES ('MOCK001', 'Test 1', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK002', 'Test 2', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK003', 'Test 3', 'Initial', 'inactive', NOW(), NOW(), NOW());"

# 2. Check count (should be 3)
curl http://localhost:3000/api/testMockCount

# 3. Test OLD approach with API failure (DANGEROUS!)
curl -X POST http://localhost:3000/api/testOldApproachFail

# 4. Check count (should be 0 - DATA LOST!)
curl http://localhost:3000/api/testMockCount
```

## Expected Console Output

### NEW Approach (API Failure):
```
🧪 ========== TEST 2: NEW APPROACH - API FAILURE SCENARIO ==========
📊 Current records in database: 3
📡 STEP 1: Fetching data from API...
❌ STEP 2: Fetch FAILED
⚠️  Table NOT truncated - preserving existing data
🛡️  Table reset SKIPPED - old data preserved
📊 Final records in database: 3 (unchanged)
```

### OLD Approach (API Failure):
```
🧪 ========== TEST 4: OLD APPROACH - API FAILURE SCENARIO (DANGEROUS) ==========
📊 Current records in database: 3
🧹 STEP 1: Truncating table FIRST...
⚠️  Data deleted - no turning back now!
📡 STEP 2: Attempting to fetch from API...
❌ STEP 3: Fetch FAILED or no data
💥 RESULT: Table is now EMPTY - data lost!
```

## Cleanup

After testing, you can drop the test table:
```sql
DROP TABLE IF EXISTS test_mock;
```

Or keep it for future testing.

## Conclusion

This test module clearly demonstrates:

✅ **NEW Approach (Fetch First):**
- Preserves data when API fails
- No data loss risk
- Dashboard always has data (old or new)

❌ **OLD Approach (Truncate First):**
- Data lost if API fails
- No recovery possible
- Dashboard would show empty data

**Recommendation:** Refactor all 11 modules to use the NEW approach.
