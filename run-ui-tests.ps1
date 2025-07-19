# UI Testing Script for Multi-Tenant SaaS Bug Tracker
param(
    [string]$TestType = "all", # all, manual, e2e, load
    [string]$BaseUrl = "http://localhost:5173",
    [string]$ApiUrl = "http://localhost:3001/api",
    [switch]$GenerateTestData = $true,
    [switch]$CleanupAfter = $false
)

Write-Host "🧪 Multi-Tenant SaaS UI Testing Suite" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test configuration
$testConfig = @{
    baseUrl = $BaseUrl
    apiUrl = $ApiUrl
    testUsers = @(
        @{ email = "admin@acme.com"; password = "password123"; role = "admin"; org = "acme" },
        @{ email = "dev@acme.com"; password = "password123"; role = "developer"; org = "acme" },
        @{ email = "viewer@acme.com"; password = "password123"; role = "viewer"; org = "acme" },
        @{ email = "admin@beta.com"; password = "password123"; role = "admin"; org = "beta" }
    )
    testOrgs = @(
        @{ name = "Acme Corporation"; slug = "acme" },
        @{ name = "Beta Industries"; slug = "beta" }
    )
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if frontend is running
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -Method HEAD -TimeoutSec 5
        Write-Host "✅ Frontend is running at $BaseUrl" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend not accessible at $BaseUrl" -ForegroundColor Red
        Write-Host "Please start the frontend with: npm run dev" -ForegroundColor Yellow
        return $false
    }
    
    # Check if backend is running
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 5
        Write-Host "✅ Backend is running at $ApiUrl" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend not accessible at $ApiUrl" -ForegroundColor Red
        Write-Host "Please start the backend with: npm run dev" -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

function Generate-TestData {
    if (-not $GenerateTestData) {
        Write-Host "⏭️  Skipping test data generation" -ForegroundColor Yellow
        return
    }
    
    Write-Host "📊 Generating test data..." -ForegroundColor Yellow
    
    try {
        & ".\test-data-generator.ps1" -ApiUrl $ApiUrl
        Write-Host "✅ Test data generated successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Test data generation failed, continuing with existing data" -ForegroundColor Yellow
    }
}

function Run-ManualTests {
    Write-Host ""
    Write-Host "📋 Manual Testing Checklist" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    
    $manualTests = @(
        @{
            name = "Organization Creation"
            steps = @(
                "1. Go to $BaseUrl",
                "2. Login with admin@acme.com / password123",
                "3. Click organization switcher in header",
                "4. Click 'Create Organization'",
                "5. Enter name 'Test Org' and slug 'test-org'",
                "6. Click 'Create Organization'",
                "7. Verify organization appears in switcher"
            )
            expected = "New organization created and selected"
        },
        @{
            name = "Organization Switching"
            steps = @(
                "1. Open organization switcher",
                "2. Select 'Beta Industries'",
                "3. Verify URL/context changes",
                "4. Check that bug list is different",
                "5. Switch back to 'Acme Corporation'",
                "6. Verify original bugs are visible"
            )
            expected = "Data isolation maintained between organizations"
        },
        @{
            name = "Role-Based Permissions"
            steps = @(
                "1. Logout and login as viewer@acme.com / password123",
                "2. Go to bugs page",
                "3. Verify status dropdowns are disabled/hidden",
                "4. Verify assignment dropdowns are disabled/hidden",
                "5. Verify 'Create Bug' button is hidden",
                "6. Logout and login as admin@acme.com",
                "7. Verify all controls are now available"
            )
            expected = "Viewer has read-only access, admin has full access"
        },
        @{
            name = "Status Dropdown Functionality"
            steps = @(
                "1. Login as admin@acme.com / password123",
                "2. Go to bugs page",
                "3. Click status dropdown on any bug",
                "4. Select 'In Progress'",
                "5. Verify status updates immediately",
                "6. Check status chip color changes",
                "7. Refresh page and verify status persisted"
            )
            expected = "Status changes work smoothly with visual feedback"
        },
        @{
            name = "Assignment Dropdown Functionality"
            steps = @(
                "1. Click assignment dropdown on any bug",
                "2. Select a team member",
                "3. Verify assignment updates immediately",
                "4. Check assignee chip shows correct name",
                "5. Refresh page and verify assignment persisted"
            )
            expected = "Assignment changes work with proper display"
        },
        @{
            name = "Subscription Limits"
            steps = @(
                "1. Go to /billing page",
                "2. Check usage indicators for users/projects/bugs",
                "3. Verify current plan is displayed",
                "4. Check upgrade button is available",
                "5. Try to exceed limits (if possible)",
                "6. Verify upgrade prompts appear"
            )
            expected = "Usage tracking and upgrade prompts work correctly"
        }
    )
    
    foreach ($test in $manualTests) {
        Write-Host ""
        Write-Host "🧪 Test: $($test.name)" -ForegroundColor Magenta
        Write-Host "Steps:" -ForegroundColor Yellow
        foreach ($step in $test.steps) {
            Write-Host "   $step" -ForegroundColor Gray
        }
        Write-Host "Expected Result: $($test.expected)" -ForegroundColor Green
        
        $result = Read-Host "Did this test pass? (y/n/s to skip)"
        switch ($result.ToLower()) {
            "y" { Write-Host "✅ PASSED" -ForegroundColor Green }
            "n" { Write-Host "❌ FAILED" -ForegroundColor Red }
            "s" { Write-Host "⏭️  SKIPPED" -ForegroundColor Yellow }
            default { Write-Host "⏭️  SKIPPED" -ForegroundColor Yellow }
        }
    }
}

function Run-E2ETests {
    Write-Host ""
    Write-Host "🤖 Running E2E Tests..." -ForegroundColor Cyan
    
    # Check if Playwright is installed
    if (Get-Command "npx" -ErrorAction SilentlyContinue) {
        try {
            Write-Host "Installing Playwright if needed..." -ForegroundColor Yellow
            npx playwright install
            
            Write-Host "Running Playwright tests..." -ForegroundColor Yellow
            npx playwright test e2e-tests/multi-tenant.spec.ts --headed
            
            Write-Host "✅ E2E tests completed" -ForegroundColor Green
        } catch {
            Write-Host "❌ E2E tests failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Node.js/npm not found. Please install to run E2E tests." -ForegroundColor Yellow
        Write-Host "Manual E2E testing checklist:" -ForegroundColor Cyan
        Write-Host "1. Test organization creation and switching" -ForegroundColor Gray
        Write-Host "2. Test data isolation between organizations" -ForegroundColor Gray
        Write-Host "3. Test role-based permissions" -ForegroundColor Gray
        Write-Host "4. Test status and assignment dropdowns" -ForegroundColor Gray
        Write-Host "5. Test subscription limits" -ForegroundColor Gray
    }
}

function Run-LoadTests {
    Write-Host ""
    Write-Host "⚡ Load Testing Scenarios" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    Write-Host "Load testing scenarios to perform:" -ForegroundColor Yellow
    Write-Host "1. Multiple users in same organization" -ForegroundColor Gray
    Write-Host "2. Multiple organizations simultaneously" -ForegroundColor Gray
    Write-Host "3. Rapid organization switching" -ForegroundColor Gray
    Write-Host "4. Concurrent bug creation/editing" -ForegroundColor Gray
    Write-Host "5. Database performance under load" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Recommended tools:" -ForegroundColor Yellow
    Write-Host "- Artillery.js for API load testing" -ForegroundColor Gray
    Write-Host "- Playwright for UI load testing" -ForegroundColor Gray
    Write-Host "- k6 for comprehensive load testing" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Sample load test command:" -ForegroundColor Yellow
    Write-Host "npx artillery quick --count 10 --num 5 $ApiUrl/bugs" -ForegroundColor Gray
}

function Show-TestSummary {
    Write-Host ""
    Write-Host "📊 Testing Summary" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green
    
    Write-Host "✅ Prerequisites checked" -ForegroundColor Green
    if ($GenerateTestData) {
        Write-Host "✅ Test data generated" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🔗 Useful URLs:" -ForegroundColor Yellow
    Write-Host "Frontend: $BaseUrl" -ForegroundColor Cyan
    Write-Host "Backend API: $ApiUrl" -ForegroundColor Cyan
    Write-Host "Testing Dashboard: $BaseUrl/testing" -ForegroundColor Cyan
    Write-Host "Billing Dashboard: $BaseUrl/billing" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "👥 Test Accounts:" -ForegroundColor Yellow
    foreach ($user in $testConfig.testUsers) {
        Write-Host "   $($user.email) / $($user.password) ($($user.role) @ $($user.org))" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🏢 Test Organizations:" -ForegroundColor Yellow
    foreach ($org in $testConfig.testOrgs) {
        Write-Host "   $($org.name) ($($org.slug))" -ForegroundColor Gray
    }
}

function Cleanup-TestData {
    if (-not $CleanupAfter) {
        return
    }
    
    Write-Host ""
    Write-Host "🧹 Cleaning up test data..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/test/cleanup" -Method DELETE
        Write-Host "✅ Test data cleaned up" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Cleanup failed or not implemented" -ForegroundColor Yellow
    }
}

# Main execution
if (-not (Test-Prerequisites)) {
    exit 1
}

Generate-TestData

switch ($TestType.ToLower()) {
    "manual" { Run-ManualTests }
    "e2e" { Run-E2ETests }
    "load" { Run-LoadTests }
    "all" {
        Run-ManualTests
        Run-E2ETests
        Run-LoadTests
    }
    default {
        Write-Host "Invalid test type. Use: all, manual, e2e, or load" -ForegroundColor Red
        exit 1
    }
}

Show-TestSummary
Cleanup-TestData

Write-Host ""
Write-Host "🎉 UI Testing Complete!" -ForegroundColor Green
Write-Host "Check the results above and fix any failing tests." -ForegroundColor Yellow
