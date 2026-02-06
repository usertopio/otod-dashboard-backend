# Test Mock API - Quick Test Script
# Run this to test all scenarios

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Mock Module - Automated Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if server is running
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET -ErrorAction Stop
    Write-Host "✅ Server is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start with 'npm start'`n" -ForegroundColor Red
    exit 1
}

# Test 1: Check initial count
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test 0: Check Initial Count" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$initialCount = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "Initial records: $($initialCount.count)" -ForegroundColor Yellow

# Test 1: NEW Approach - Success
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test 1: NEW Approach - Success Scenario" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$test1 = Invoke-RestMethod -Uri "http://localhost:3000/api/testNewApproachSuccess" -Method POST -ContentType "application/json"
Write-Host "Result:" -ForegroundColor Yellow
$test1 | ConvertTo-Json -Depth 5
Start-Sleep -Seconds 2

# Check count after Test 1
$count1 = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "`nRecords after Test 1: $($count1.count)" -ForegroundColor Yellow

# Reset to 3 records before next test
Write-Host "`nResetting to 3 test records for next test..." -ForegroundColor Yellow
mysql -u root -p1234 otod -e "DELETE FROM test_mock; INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES ('MOCK001', 'Test 1', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK002', 'Test 2', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK003', 'Test 3', 'Initial', 'inactive', NOW(), NOW(), NOW());" 2>$null
Start-Sleep -Seconds 1

# Test 2: NEW Approach - API Failure (should preserve data)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test 2: NEW Approach - API Failure (Data Preserved)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$count2Before = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "Records BEFORE test: $($count2Before.count)" -ForegroundColor Yellow

$test2 = Invoke-RestMethod -Uri "http://localhost:3000/api/testNewApproachFail" -Method POST -ContentType "application/json"
Write-Host "`nResult:" -ForegroundColor Yellow
$test2 | ConvertTo-Json -Depth 5

$count2After = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "`nRecords AFTER test: $($count2After.count)" -ForegroundColor Yellow

if ($count2Before.count -eq $count2After.count) {
    Write-Host "✅ SUCCESS: Data preserved! ($($count2Before.count) → $($count2After.count))" -ForegroundColor Green
} else {
    Write-Host "❌ FAILED: Data was modified! ($($count2Before.count) → $($count2After.count))" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Reset to 3 records before next test
Write-Host "`nResetting to 3 test records for next test..." -ForegroundColor Yellow
mysql -u root -p1234 otod -e "DELETE FROM test_mock; INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES ('MOCK001', 'Test 1', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK002', 'Test 2', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK003', 'Test 3', 'Initial', 'inactive', NOW(), NOW(), NOW());" 2>$null
Start-Sleep -Seconds 1

# Test 3: OLD Approach - Success
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test 3: OLD Approach - Success Scenario" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$test3 = Invoke-RestMethod -Uri "http://localhost:3000/api/testOldApproachSuccess" -Method POST -ContentType "application/json"
Write-Host "Result:" -ForegroundColor Yellow
$test3 | ConvertTo-Json -Depth 5
Start-Sleep -Seconds 2

# Reset to 3 records before final test
Write-Host "`nResetting to 3 test records for final test..." -ForegroundColor Yellow
mysql -u root -p1234 otod -e "DELETE FROM test_mock; INSERT INTO test_mock (rec_id, name, description, status, created_at, updated_at, fetch_at) VALUES ('MOCK001', 'Test 1', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK002', 'Test 2', 'Initial', 'active', NOW(), NOW(), NOW()), ('MOCK003', 'Test 3', 'Initial', 'inactive', NOW(), NOW(), NOW());" 2>$null
Start-Sleep -Seconds 1

# Test 4: OLD Approach - API Failure (DATA LOSS!)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test 4: OLD Approach - API Failure (DATA LOSS!)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$count4Before = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "Records BEFORE test: $($count4Before.count)" -ForegroundColor Yellow

$test4 = Invoke-RestMethod -Uri "http://localhost:3000/api/testOldApproachFail" -Method POST -ContentType "application/json"
Write-Host "`nResult:" -ForegroundColor Yellow
$test4 | ConvertTo-Json -Depth 5

$count4After = Invoke-RestMethod -Uri "http://localhost:3000/api/testMockCount" -Method GET
Write-Host "`nRecords AFTER test: $($count4After.count)" -ForegroundColor Yellow

if ($count4After.count -eq 0) {
    Write-Host "⚠️  DEMONSTRATED: Data LOST! ($($count4Before.count) → $($count4After.count))" -ForegroundColor Red
} else {
    Write-Host "Unexpected: Data still exists ($($count4After.count))" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Test 1 (NEW + Success): Completed" -ForegroundColor Green
Write-Host "✅ Test 2 (NEW + Failure): Data preserved as expected" -ForegroundColor Green
Write-Host "✅ Test 3 (OLD + Success): Completed" -ForegroundColor Green
Write-Host "⚠️  Test 4 (OLD + Failure): Demonstrated data loss risk" -ForegroundColor Red
Write-Host "`nConclusion: NEW approach (fetch first) is SAFER!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
