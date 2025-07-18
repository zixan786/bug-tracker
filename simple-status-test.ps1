# Simple Bug Status Change Test
$baseUrl = "http://localhost:3001/api"

Write-Host "=== TESTING BUG STATUS CHANGES ===" -ForegroundColor Green

# Login as admin
Write-Host "Logging in as admin..."
$adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bugtracker.com","password":"admin123"}'
$adminToken = $adminResponse.data.token
$adminHeaders = @{"Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json"}
Write-Host "✓ Admin logged in" -ForegroundColor Green

# Get existing bugs
Write-Host "Getting existing bugs..."
$bugsResponse = Invoke-RestMethod -Uri "$baseUrl/bugs" -Method GET -Headers $adminHeaders
$bugs = $bugsResponse.data.bugs

if ($bugs.Count -gt 0) {
    $testBug = $bugs[0]
    $bugId = $testBug.id
    $currentStatus = $testBug.status
    Write-Host "✓ Using bug ID: $bugId, Current status: $currentStatus" -ForegroundColor Green
    
    # Test status change
    Write-Host "Testing status change: $currentStatus -> in_progress"
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"in_progress","notes":"Testing status change from PowerShell"}'
        Write-Host "✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
    } catch {
        Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Get bug history
    Write-Host "Getting bug history..."
    try {
        $historyResponse = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/history" -Method GET -Headers $adminHeaders
        Write-Host "✓ History entries: $($historyResponse.data.history.Count)" -ForegroundColor Green
        
        # Show last 3 history entries
        $recentHistory = $historyResponse.data.history | Select-Object -First 3
        foreach ($entry in $recentHistory) {
            Write-Host "  - $($entry.action): $($entry.description)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "✗ History failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "No bugs found. Creating a test bug..." -ForegroundColor Yellow
    
    # Create a project first
    try {
        $projectResponse = Invoke-RestMethod -Uri "$baseUrl/projects" -Method POST -Headers $adminHeaders -Body '{"name":"Test Project","description":"Test","status":"active"}'
        $projectId = $projectResponse.data.project.id
        Write-Host "✓ Project created: $projectId" -ForegroundColor Green
    } catch {
        Write-Host "Project creation failed, using existing..." -ForegroundColor Yellow
        $projectsResponse = Invoke-RestMethod -Uri "$baseUrl/projects" -Method GET -Headers $adminHeaders
        if ($projectsResponse.data.projects.Count -gt 0) {
            $projectId = $projectsResponse.data.projects[0].id
        } else {
            Write-Host "✗ No projects available" -ForegroundColor Red
            exit 1
        }
    }
    
    # Create a bug
    $bugData = @{
        title = "Test Bug for Status Change"
        description = "Testing the new status change functionality"
        type = "bug"
        priority = "medium"
        severity = "minor"
        status = "open"
        projectId = $projectId
    } | ConvertTo-Json
    
    try {
        $bugResponse = Invoke-RestMethod -Uri "$baseUrl/bugs" -Method POST -Headers $adminHeaders -Body $bugData
        $bugId = $bugResponse.data.bug.id
        Write-Host "✓ Bug created: ID $bugId" -ForegroundColor Green
        
        # Test status change on new bug
        Write-Host "Testing status change: open -> in_progress"
        $result = Invoke-RestMethod -Uri "$baseUrl/bugs/$bugId/status" -Method PUT -Headers $adminHeaders -Body '{"status":"in_progress","notes":"Testing new bug status change"}'
        Write-Host "✓ SUCCESS: Status changed to $($result.data.bug.status)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Bug creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETED ===" -ForegroundColor Green
Write-Host "Now you can test the frontend:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:5173/bugs" -ForegroundColor Cyan
Write-Host "2. Look for the play arrow (▶) next to status chips" -ForegroundColor Cyan
Write-Host "3. Click it to change bug status directly from the table!" -ForegroundColor Cyan
