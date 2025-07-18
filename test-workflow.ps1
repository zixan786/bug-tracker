# Bug Workflow Testing Script
$baseUrl = "http://localhost:3001/api"

Write-Host "=== BUG WORKFLOW TESTING ===" -ForegroundColor Green

# 1. Login as admin
Write-Host ""
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bugtracker.com","password":"admin123"}'
    $adminToken = $adminResponse.data.token
    $adminHeaders = @{"Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json"}
    Write-Host "✓ Admin logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Create a project
Write-Host ""
Write-Host "2. Creating a test project..." -ForegroundColor Yellow
try {
    $projectResponse = Invoke-RestMethod -Uri "$baseUrl/projects" -Method POST -Headers $adminHeaders -Body '{"name":"Workflow Test Project","description":"Testing bug workflow","status":"active"}'
    $projectId = $projectResponse.data.project.id
    Write-Host "✓ Project created: ID $projectId" -ForegroundColor Green
} catch {
    Write-Host "✗ Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Create a developer user
Write-Host ""
Write-Host "3. Creating a developer user..." -ForegroundColor Yellow
try {
    $devResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"dev@workflow.test","password":"password123","firstName":"Dev","lastName":"User","role":"developer"}'
    $devUserId = $devResponse.data.user.id
    Write-Host "✓ Developer created: ID $devUserId" -ForegroundColor Green
} catch {
    Write-Host "Developer might already exist, continuing..." -ForegroundColor Yellow
    # Try to login instead
    $devLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"dev@workflow.test","password":"password123"}'
    $devUserId = $devLoginResponse.data.user.id
}

# Get developer token
$devLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"dev@workflow.test","password":"password123"}'
$devToken = $devLoginResponse.data.token
$devHeaders = @{"Authorization" = "Bearer $devToken"; "Content-Type" = "application/json"}

# 4. Create a bug
Write-Host ""
Write-Host "4. Creating a bug..." -ForegroundColor Yellow
try {
    $bugData = @{
        title = "Test Bug for Workflow"
        description = "This is a test bug to demonstrate the workflow system"
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

# 5. Test workflow transitions
Write-Host ""
Write-Host "5. Testing workflow transitions..." -ForegroundColor Yellow

# Developer: open -> in_progress
Write-Host "  Developer: open -> in_progress"
try {
    $transitionResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $devHeaders -Body '{"status":"in_progress","notes":"Starting work on this bug"}'
    Write-Host "  ✓ Transition successful: $($transitionResponse.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Transition failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Developer: in_progress -> code_review
Write-Host "  Developer: in_progress -> code_review"
try {
    $transitionResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $devHeaders -Body '{"status":"code_review","notes":"Code ready for review"}'
    Write-Host "  ✓ Transition successful: $($transitionResponse.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Transition failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Admin: code_review -> qa_testing (Admin can do anything)
Write-Host "  Admin: code_review -> qa_testing"
try {
    $transitionResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"qa_testing","notes":"Moving to QA testing"}'
    Write-Host "  ✓ Transition successful: $($transitionResponse.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Transition failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Admin: qa_testing -> resolved
Write-Host "  Admin: qa_testing -> resolved"
try {
    $transitionResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"resolved","notes":"Bug has been resolved"}'
    Write-Host "  ✓ Transition successful: $($transitionResponse.data.bug.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Transition failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Get bug history
Write-Host ""
Write-Host "6. Getting bug history..." -ForegroundColor Yellow
try {
    $historyResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/history" -Method GET -Headers $adminHeaders
    Write-Host "✓ Bug history retrieved: $($historyResponse.data.history.Count) entries" -ForegroundColor Green
    
    foreach ($entry in $historyResponse.data.history) {
        Write-Host "  - $($entry.createdAt): $($entry.action) by User $($entry.userId)" -ForegroundColor Cyan
        if ($entry.description) {
            Write-Host "    $($entry.description)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ History retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== WORKFLOW TESTING COMPLETED ===" -ForegroundColor Green
Write-Host ""
Write-Host "To change bug status in the frontend, use the new API endpoint:" -ForegroundColor Yellow
Write-Host "PUT /api/bugs/:id/status with body: {status: new_status, notes: optional notes}" -ForegroundColor Cyan
