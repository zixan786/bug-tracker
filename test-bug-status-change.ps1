# Bug Status Change Testing Script
$baseUrl = "http://localhost:3001/api"

Write-Host "=== BUG STATUS CHANGE TESTING ===" -ForegroundColor Green

# 1. Login as admin and create test data
Write-Host ""
Write-Host "1. Setting up test data..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bugtracker.com","password":"admin123"}'
    $adminToken = $adminResponse.data.token
    $adminHeaders = @{"Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json"}
    Write-Host "✓ Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create a project if needed
try {
    $projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Method GET -Headers $adminHeaders
    if ($projects.data.projects.Count -eq 0) {
        $projectResponse = Invoke-RestMethod -Uri "$baseUrl/projects" -Method POST -Headers $adminHeaders -Body '{"name":"Status Test Project","description":"Testing status changes","status":"active"}'
        $projectId = $projectResponse.data.project.id
        Write-Host "✓ Project created: ID $projectId" -ForegroundColor Green
    } else {
        $projectId = $projects.data.projects[0].id
        Write-Host "✓ Using existing project: ID $projectId" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Project setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create a developer user if needed
try {
    $devResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"dev@status.test","password":"password123","firstName":"Dev","lastName":"User","role":"developer"}'
    $devUserId = $devResponse.data.user.id
    Write-Host "✓ Developer created: ID $devUserId" -ForegroundColor Green
} catch {
    # User might already exist, try to login
    try {
        $devLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"dev@status.test","password":"password123"}'
        $devUserId = $devLoginResponse.data.user.id
        Write-Host "✓ Developer exists: ID $devUserId" -ForegroundColor Green
    } catch {
        Write-Host "✗ Developer setup failed" -ForegroundColor Red
        exit 1
    }
}

# Get developer token
$devLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"dev@status.test","password":"password123"}'
$devToken = $devLoginResponse.data.token
$devHeaders = @{"Authorization" = "Bearer $devToken"; "Content-Type" = "application/json"}

# 2. Create a test bug
Write-Host ""
Write-Host "2. Creating test bug..." -ForegroundColor Yellow
try {
    $bugData = @{
        title = "Status Change Test Bug"
        description = "This bug is for testing status transitions"
        type = "bug"
        priority = "medium"
        severity = "minor"
        status = "open"
        projectId = $projectId
        assigneeId = $devUserId
    } | ConvertTo-Json

    $bugResponse = Invoke-RestMethod -Uri "$baseUrl/bugs" -Method POST -Headers $adminHeaders -Body $bugData
    $bugId = $bugResponse.data.bug.id
    Write-Host "✓ Bug created: ID $bugId, Status: $($bugResponse.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Bug creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Test status transitions
Write-Host ""
Write-Host "3. Testing status transitions..." -ForegroundColor Yellow

# Test 1: Developer changes open -> in_progress
Write-Host "  Test 1: Developer: open -> in_progress"
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $devHeaders -Body '{"status":"in_progress","notes":"Developer starting work"}'
    Write-Host "  ✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Developer changes in_progress -> code_review
Write-Host "  Test 2: Developer: in_progress -> code_review"
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $devHeaders -Body '{"status":"code_review","notes":"Code ready for review"}'
    Write-Host "  ✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Admin changes code_review -> qa_testing
Write-Host "  Test 3: Admin: code_review -> qa_testing"
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"qa_testing","notes":"Moving to QA"}'
    Write-Host "  ✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Admin changes qa_testing -> resolved
Write-Host "  Test 4: Admin: qa_testing -> resolved"
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"resolved","notes":"Bug fixed and tested"}'
    Write-Host "  ✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Try invalid transition (Developer trying to change resolved -> closed)
Write-Host "  Test 5: Developer: resolved -> closed (should fail)"
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $devHeaders -Body '{"status":"closed","notes":"Trying to close"}'
    Write-Host "  ✗ UNEXPECTED SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Red
} catch {
    Write-Host "  ✓ EXPECTED FAILURE: $($_.Exception.Message)" -ForegroundColor Green
}

# 4. Get bug history
Write-Host ""
Write-Host "4. Bug history..." -ForegroundColor Yellow
try {
    $historyResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/history" -Method GET -Headers $adminHeaders
    Write-Host "✓ Bug history retrieved: $($historyResponse.data.history.Count) entries" -ForegroundColor Green
    
    foreach ($entry in $historyResponse.data.history) {
        $timestamp = [DateTime]::Parse($entry.createdAt).ToString("HH:mm:ss")
        Write-Host "  $timestamp - $($entry.action): $($entry.description)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ History retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Final bug status
Write-Host ""
Write-Host "5. Final bug status..." -ForegroundColor Yellow
try {
    $finalBug = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId" -Method GET -Headers $adminHeaders
    Write-Host "✓ Final bug status: $($finalBug.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get final status" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== STATUS CHANGE TESTING COMPLETED ===" -ForegroundColor Green
Write-Host ""
Write-Host "FRONTEND USAGE:" -ForegroundColor Yellow
Write-Host "1. Go to the Bugs page in your browser" -ForegroundColor Cyan
Write-Host "2. Look for the play arrow (▶) next to bug status chips" -ForegroundColor Cyan
Write-Host "3. Click the play arrow to see available status transitions" -ForegroundColor Cyan
Write-Host "4. Select a new status to transition the bug" -ForegroundColor Cyan
Write-Host "5. Only valid transitions for your role will be shown" -ForegroundColor Cyan
