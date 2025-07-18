# Bug Tracker API Testing Script
# PowerShell script to test all API endpoints

$baseUrl = "http://localhost:3001/api"
$adminToken = ""

# Function to make authenticated requests
function Invoke-AuthenticatedRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$Body = $null,
        [string]$Token = $adminToken
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers -Body $Body
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== Bug Tracker API Testing ===" -ForegroundColor Green

# 1. Test Authentication
Write-Host ""
Write-Host "1. Testing Authentication..." -ForegroundColor Yellow

# Login as admin
Write-Host "Logging in as admin..."
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bugtracker.com","password":"admin123"}'

if ($loginResponse.success) {
    $adminToken = $loginResponse.data.token
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "Admin User: $($loginResponse.data.user.firstName) $($loginResponse.data.user.lastName) ($($loginResponse.data.user.role))"
} else {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    exit 1
}

# Test profile endpoint
Write-Host "Testing profile endpoint..."
$userProfile = Invoke-AuthenticatedRequest -Uri "$baseUrl/auth/profile"
if ($userProfile) {
    Write-Host "✓ Profile retrieved successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Profile retrieval failed" -ForegroundColor Red
}

# 2. Test User Registration
Write-Host ""
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow

$newUser = @{
    email = "testuser@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
    role = "developer"
} | ConvertTo-Json

Write-Host "Registering new user..."
$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $newUser

if ($registerResponse.success) {
    Write-Host "✓ User registration successful" -ForegroundColor Green
    $testUserId = $registerResponse.data.user.id
    $testUserToken = $registerResponse.data.token
} else {
    Write-Host "✗ User registration failed: $($registerResponse.message)" -ForegroundColor Red
}

Write-Host "Authentication tests completed!" -ForegroundColor Green
