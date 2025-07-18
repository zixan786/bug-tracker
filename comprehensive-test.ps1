# Comprehensive Bug Tracker API Testing Script
$baseUrl = "http://localhost:3001/api"

Write-Host "=== COMPREHENSIVE BUG TRACKER API TESTING ===" -ForegroundColor Green

# Test Results Storage
$testResults = @()

function Test-Endpoint {
    param(
        [string]$TestName,
        [scriptblock]$TestScript
    )
    
    Write-Host "`n--- Testing: $TestName ---" -ForegroundColor Yellow
    try {
        $result = & $TestScript
        if ($result) {
            Write-Host "✓ $TestName - PASSED" -ForegroundColor Green
            $testResults += @{Name = $TestName; Status = "PASSED"; Details = $result}
        } else {
            Write-Host "✗ $TestName - FAILED" -ForegroundColor Red
            $testResults += @{Name = $TestName; Status = "FAILED"; Details = "No result returned"}
        }
    } catch {
        Write-Host "✗ $TestName - ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Name = $TestName; Status = "ERROR"; Details = $_.Exception.Message}
    }
}

# 1. AUTHENTICATION TESTS
Test-Endpoint "Admin Login" {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bugtracker.com","password":"admin123"}'
    $global:adminToken = $response.data.token
    $global:adminHeaders = @{"Authorization" = "Bearer $global:adminToken"; "Content-Type" = "application/json"}
    return "Admin: $($response.data.user.firstName) $($response.data.user.lastName) ($($response.data.user.role))"
}

Test-Endpoint "User Registration" {
    $newUser = @{
        email = "developer1@test.com"
        password = "password123"
        firstName = "John"
        lastName = "Developer"
        role = "developer"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $newUser
    $global:devToken = $response.data.token
    $global:devHeaders = @{"Authorization" = "Bearer $global:devToken"; "Content-Type" = "application/json"}
    $global:devUserId = $response.data.user.id
    return "User ID: $($response.data.user.id), Name: $($response.data.user.firstName) $($response.data.user.lastName)"
}

Test-Endpoint "Tester Registration" {
    $newUser = @{
        email = "tester1@test.com"
        password = "password123"
        firstName = "Jane"
        lastName = "Tester"
        role = "tester"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $newUser
    $global:testerToken = $response.data.token
    $global:testerHeaders = @{"Authorization" = "Bearer $global:testerToken"; "Content-Type" = "application/json"}
    $global:testerUserId = $response.data.user.id
    return "User ID: $($response.data.user.id), Name: $($response.data.user.firstName) $($response.data.user.lastName)"
}

# 2. USER MANAGEMENT TESTS
Test-Endpoint "Get All Users (Admin)" {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers $global:adminHeaders
    return "Total users: $($response.data.users.Count)"
}

Test-Endpoint "Get User Profile" {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Headers $global:adminHeaders
    return "Profile: $($response.data.firstName) $($response.data.lastName)"
}

# 3. PROJECT MANAGEMENT TESTS
Test-Endpoint "Create Project" {
    $project = @{
        name = "E-Commerce Platform"
        description = "Main e-commerce platform project"
        status = "active"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/projects" -Method POST -Headers $global:adminHeaders -Body $project
    $global:projectId = $response.data.project.id
    return "Project ID: $($response.data.project.id), Name: $($response.data.project.name)"
}

Test-Endpoint "Get All Projects" {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects" -Method GET -Headers $global:adminHeaders
    return "Total projects: $($response.data.projects.Count)"
}

Test-Endpoint "Get Project by ID" {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$global:projectId" -Method GET -Headers $global:adminHeaders
    return "Project: $($response.data.project.name) - Status: $($response.data.project.status)"
}

Test-Endpoint "Add Member to Project" {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$global:projectId/members/$global:devUserId" -Method POST -Headers $global:adminHeaders
    return "Added developer to project"
}

# 4. BUG MANAGEMENT TESTS
Test-Endpoint "Create Bug" {
    $bug = @{
        title = "Login page not responsive on mobile"
        description = "The login page layout breaks on mobile devices with screen width less than 768px"
        type = "bug"
        priority = "high"
        severity = "medium"
        status = "open"
        projectId = $global:projectId
        assigneeId = $global:devUserId
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/bugs" -Method POST -Headers $global:adminHeaders -Body $bug
    $global:bugId = $response.data.bug.id
    return "Bug ID: $($response.data.bug.id), Title: $($response.data.bug.title)"
}

Test-Endpoint "Get All Bugs" {
    $response = Invoke-RestMethod -Uri "$baseUrl/bugs" -Method GET -Headers $global:adminHeaders
    return "Total bugs: $($response.data.bugs.Count)"
}

Test-Endpoint "Get Bug by ID" {
    $response = Invoke-RestMethod -Uri "$baseUrl/bugs/$global:bugId" -Method GET -Headers $global:adminHeaders
    return "Bug: $($response.data.bug.title) - Status: $($response.data.bug.status)"
}

Test-Endpoint "Update Bug Status" {
    $update = @{
        status = "in_progress"
        priority = "critical"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/bugs/$global:bugId" -Method PUT -Headers $global:devHeaders -Body $update
    return "Updated bug status to: $($response.data.bug.status)"
}

Test-Endpoint "Add Comment to Bug" {
    $comment = @{
        content = "I've started working on this issue. The problem seems to be with the CSS media queries."
        isInternal = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/bugs/$global:bugId/comments" -Method POST -Headers $global:devHeaders -Body $comment
    return "Added comment: $($response.data.comment.content.Substring(0, 50))..."
}

# Print Test Results Summary
Write-Host "`n=== TEST RESULTS SUMMARY ===" -ForegroundColor Green
$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$errors = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Errors: $errors" -ForegroundColor Yellow

if ($failed -gt 0 -or $errors -gt 0) {
    Write-Host "`nFailed/Error Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -ne "PASSED" } | ForEach-Object {
        Write-Host "- $($_.Name): $($_.Status) - $($_.Details)" -ForegroundColor Red
    }
}

Write-Host "`n=== TESTING COMPLETED ===" -ForegroundColor Green
