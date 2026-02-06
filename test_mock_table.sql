-- SQL statement to create test_mock table for testing the new fetch-first approach
-- This table mimics the structure of other tables in the project

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

-- Optional: Insert some initial test data
INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES
('MOCK001', 'Test Record 1', 'Initial test data', 'active', NOW(), NOW(), NOW()),
('MOCK002', 'Test Record 2', 'Initial test data', 'active', NOW(), NOW(), NOW()),
('MOCK003', 'Test Record 3', 'Initial test data', 'inactive', NOW(), NOW(), NOW());

-- To check data before testing:
-- SELECT * FROM test_mock;

-- To manually reset for testing:
-- DELETE FROM test_mock;
-- ALTER TABLE test_mock AUTO_INCREMENT = 1;

-- To drop table when done testing:
-- DROP TABLE IF EXISTS test_mock;
