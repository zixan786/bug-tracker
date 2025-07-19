# Simple UI Testing Script
Write-Host "🧪 Multi-Tenant SaaS UI Testing" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

$baseUrl = "http://localhost:5173"
$apiUrl = "http://localhost:3001/api"

Write-Host ""
Write-Host "🔍 Testing Prerequisites..." -ForegroundColor Yellow

# Test frontend
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method HEAD -TimeoutSec 5
    Write-Host "✅ Frontend running at $baseUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend not accessible. Start with: npm run dev" -ForegroundColor Red
    exit 1
}

# Test backend
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 5
    Write-Host "✅ Backend running at $apiUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not accessible. Start with: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Creating test data..." -ForegroundColor Yellow

# Create admin user
try {
    $adminData = @{
        email = "admin@acme.com"
        password = "password123"
        firstName = "Admin"
        lastName = "User"
        role = "admin"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method POST -ContentType "application/json" -Body $adminData | Out-Null
    Write-Host "✅ Admin user created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Admin user might already exist" -ForegroundColor Yellow
}

# Create viewer user
try {
    $viewerData = @{
        email = "viewer@acme.com"
        password = "password123"
        firstName = "Viewer"
        lastName = "User"
        role = "viewer"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method POST -ContentType "application/json" -Body $viewerData | Out-Null
    Write-Host "✅ Viewer user created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Viewer user might already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 Manual Testing Checklist" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Test 1: Organization Management" -ForegroundColor Magenta
Write-Host "1. Go to $baseUrl" -ForegroundColor Gray
Write-Host "2. Login with admin@acme.com / password123" -ForegroundColor Gray
Write-Host "3. Click organization switcher (if available)" -ForegroundColor Gray
Write-Host "4. Create new organization" -ForegroundColor Gray
Write-Host "5. Test organization switching" -ForegroundColor Gray
$result1 = Read-Host "Did organization management work? (y/n)"

Write-Host ""
Write-Host "Test 2: Status Dropdown" -ForegroundColor Magenta
Write-Host "1. Go to bugs page" -ForegroundColor Gray
Write-Host "2. Look for status dropdown in bug table" -ForegroundColor Gray
Write-Host "3. Click status dropdown" -ForegroundColor Gray
Write-Host "4. Select different status" -ForegroundColor Gray
Write-Host "5. Verify status updates immediately" -ForegroundColor Gray
$result2 = Read-Host "Did status dropdown work? (y/n)"

Write-Host ""
Write-Host "Test 3: Assignment Dropdown" -ForegroundColor Magenta
Write-Host "1. Look for assignment dropdown in bug table" -ForegroundColor Gray
Write-Host "2. Click assignment dropdown" -ForegroundColor Gray
Write-Host "3. Select team member" -ForegroundColor Gray
Write-Host "4. Verify assignment updates" -ForegroundColor Gray
$result3 = Read-Host "Did assignment dropdown work? (y/n)"

Write-Host ""
Write-Host "Test 4: Role-Based Permissions" -ForegroundColor Magenta
Write-Host "1. Logout and login as viewer@acme.com / password123" -ForegroundColor Gray
Write-Host "2. Go to bugs page" -ForegroundColor Gray
Write-Host "3. Verify dropdowns are disabled/hidden" -ForegroundColor Gray
Write-Host "4. Verify create button is hidden" -ForegroundColor Gray
$result4 = Read-Host "Did role restrictions work? (y/n)"

Write-Host ""
Write-Host "Test 5: Data Isolation (if multi-tenant)" -ForegroundColor Magenta
Write-Host "1. Create bug in one organization" -ForegroundColor Gray
Write-Host "2. Switch to different organization" -ForegroundColor Gray
Write-Host "3. Verify bug is not visible" -ForegroundColor Gray
Write-Host "4. Switch back and verify bug is still there" -ForegroundColor Gray
$result5 = Read-Host "Did data isolation work? (y/n/s for skip)"

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

$results = @(
    @{ name = "Organization Management"; result = $result1 },
    @{ name = "Status Dropdown"; result = $result2 },
    @{ name = "Assignment Dropdown"; result = $result3 },
    @{ name = "Role-Based Permissions"; result = $result4 },
    @{ name = "Data Isolation"; result = $result5 }
)

$passed = 0
$failed = 0
$skipped = 0

foreach ($test in $results) {
    switch ($test.result.ToLower()) {
        "y" { 
            Write-Host "✅ $($test.name): PASSED" -ForegroundColor Green
            $passed++
        }
        "n" { 
            Write-Host "❌ $($test.name): FAILED" -ForegroundColor Red
            $failed++
        }
        default { 
            Write-Host "⏭️  $($test.name): SKIPPED" -ForegroundColor Yellow
            $skipped++
        }
    }
}

Write-Host ""
Write-Host "Final Score: $passed passed, $failed failed, $skipped skipped" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "❌ Some tests failed. Please fix the issues and retest." -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "🎉 All tests passed! Your multi-tenant SaaS is working correctly." -ForegroundColor Green
}

Write-Host ""
Write-Host "🔗 Test Accounts:" -ForegroundColor Yellow
Write-Host "Admin: admin@acme.com / password123" -ForegroundColor Cyan
Write-Host "Viewer: viewer@acme.com / password123" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Yellow
Write-Host "Frontend: $baseUrl" -ForegroundColor Cyan
Write-Host "Backend: $apiUrl" -ForegroundColor Cyan
