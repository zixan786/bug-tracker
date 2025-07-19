# Multi-Tenant SaaS Test Data Generator
param(
    [string]$ApiUrl = "http://localhost:3001/api",
    [switch]$CleanData = $false
)

Write-Host "🧪 Multi-Tenant SaaS Test Data Generator" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

$baseUrl = $ApiUrl

# Test organizations data
$organizations = @(
    @{ name = "Acme Corporation"; slug = "acme"; domain = "acme.com" },
    @{ name = "Beta Industries"; slug = "beta"; domain = "beta.com" },
    @{ name = "Gamma Solutions"; slug = "gamma"; domain = "gamma.com" },
    @{ name = "Delta Systems"; slug = "delta"; domain = "delta.com" }
)

# Test users data
$users = @(
    @{ email = "john.owner@acme.com"; firstName = "John"; lastName = "Owner"; role = "admin" },
    @{ email = "jane.admin@acme.com"; firstName = "Jane"; lastName = "Admin"; role = "admin" },
    @{ email = "bob.dev@acme.com"; firstName = "Bob"; lastName = "Developer"; role = "developer" },
    @{ email = "alice.qa@acme.com"; firstName = "Alice"; lastName = "Tester"; role = "qa_tester" },
    @{ email = "charlie.viewer@acme.com"; firstName = "Charlie"; lastName = "Viewer"; role = "viewer" },
    
    @{ email = "sarah.owner@beta.com"; firstName = "Sarah"; lastName = "Owner"; role = "admin" },
    @{ email = "mike.dev@beta.com"; firstName = "Mike"; lastName = "Developer"; role = "developer" },
    @{ email = "lisa.qa@beta.com"; firstName = "Lisa"; lastName = "Tester"; role = "qa_tester" }
)

# Test projects data
$projects = @(
    @{ name = "Web Application"; description = "Main web application project" },
    @{ name = "Mobile App"; description = "iOS and Android mobile application" },
    @{ name = "API Service"; description = "Backend API service" }
)

# Test bugs data
$bugTemplates = @(
    @{ title = "Login button not working"; description = "Users cannot login with correct credentials"; type = "bug"; priority = "high"; severity = "major" },
    @{ title = "Page loading slowly"; description = "Dashboard takes too long to load"; type = "bug"; priority = "medium"; severity = "minor" },
    @{ title = "Add dark mode"; description = "Users want dark mode option"; type = "feature"; priority = "low"; severity = "trivial" },
    @{ title = "Export functionality"; description = "Need to export data to CSV"; type = "enhancement"; priority = "medium"; severity = "minor" },
    @{ title = "Mobile responsive issues"; description = "Layout breaks on mobile devices"; type = "bug"; priority = "high"; severity = "major" },
    @{ title = "Search not working"; description = "Search functionality returns no results"; type = "bug"; priority = "critical"; severity = "blocker" }
)

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "❌ API call failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Create-TestUser {
    param($userData)
    
    Write-Host "Creating user: $($userData.email)" -ForegroundColor Cyan
    
    $registerData = @{
        email = $userData.email
        password = "password123"
        firstName = $userData.firstName
        lastName = $userData.lastName
        role = $userData.role
    }
    
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/auth/register" -Body $registerData
    
    if ($response) {
        Write-Host "✅ User created: $($userData.email)" -ForegroundColor Green
        return $response.data.user
    } else {
        Write-Host "⚠️  User might already exist: $($userData.email)" -ForegroundColor Yellow
        # Try to login to get user data
        $loginData = @{
            email = $userData.email
            password = "password123"
        }
        $loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Body $loginData
        if ($loginResponse -and $loginResponse.data) {
            return $loginResponse.data.user
        }
        return $null
    }
}

function Create-TestOrganization {
    param($orgData, $ownerToken)
    
    Write-Host "Creating organization: $($orgData.name)" -ForegroundColor Cyan
    
    $headers = @{ "Authorization" = "Bearer $ownerToken" }
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/organizations" -Body $orgData -Headers $headers
    
    if ($response) {
        Write-Host "✅ Organization created: $($orgData.name)" -ForegroundColor Green
        return $response.data.organization
    }
    return $null
}

function Create-TestProject {
    param($projectData, $token, $orgId)
    
    Write-Host "  Creating project: $($projectData.name)" -ForegroundColor Cyan
    
    $headers = @{ 
        "Authorization" = "Bearer $token"
        "X-Organization-Id" = $orgId.ToString()
    }
    
    $projectData.organizationId = $orgId
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/projects" -Body $projectData -Headers $headers
    
    if ($response) {
        Write-Host "  ✅ Project created: $($projectData.name)" -ForegroundColor Green
        return $response.data.project
    }
    return $null
}

function Create-TestBug {
    param($bugData, $token, $orgId, $projectId, $assigneeId = $null)
    
    $headers = @{ 
        "Authorization" = "Bearer $token"
        "X-Organization-Id" = $orgId.ToString()
    }
    
    $bugData.organizationId = $orgId
    $bugData.projectId = $projectId
    if ($assigneeId) {
        $bugData.assigneeId = $assigneeId
    }
    
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/bugs" -Body $bugData -Headers $headers
    
    if ($response) {
        Write-Host "    ✅ Bug created: $($bugData.title)" -ForegroundColor Green
        return $response.data.bug
    }
    return $null
}

# Main execution
Write-Host ""
Write-Host "🚀 Starting test data generation..." -ForegroundColor Yellow

# Step 1: Create test users
Write-Host ""
Write-Host "📝 Creating test users..." -ForegroundColor Yellow
$createdUsers = @{}
foreach ($userData in $users) {
    $user = Create-TestUser -userData $userData
    if ($user) {
        $createdUsers[$userData.email] = $user
    }
}

# Step 2: Create organizations with owners
Write-Host ""
Write-Host "🏢 Creating organizations..." -ForegroundColor Yellow
$createdOrgs = @{}

for ($i = 0; $i -lt $organizations.Count; $i++) {
    $orgData = $organizations[$i]
    
    # Get owner for this organization (first user for each org)
    $ownerEmail = $users | Where-Object { $_.email -like "*@$($orgData.domain.Split('.')[0]).com" } | Select-Object -First 1 | ForEach-Object { $_.email }
    
    if ($ownerEmail -and $createdUsers.ContainsKey($ownerEmail)) {
        # Login as owner to get token
        $loginData = @{
            email = $ownerEmail
            password = "password123"
        }
        $loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Body $loginData
        
        if ($loginResponse) {
            $ownerToken = $loginResponse.data.token
            $org = Create-TestOrganization -orgData $orgData -ownerToken $ownerToken
            
            if ($org) {
                $createdOrgs[$orgData.slug] = @{
                    org = $org
                    ownerToken = $ownerToken
                    ownerEmail = $ownerEmail
                }
            }
        }
    }
}

# Step 3: Create projects and bugs for each organization
Write-Host ""
Write-Host "📁 Creating projects and bugs..." -ForegroundColor Yellow

foreach ($orgSlug in $createdOrgs.Keys) {
    $orgInfo = $createdOrgs[$orgSlug]
    $org = $orgInfo.org
    $token = $orgInfo.ownerToken
    
    Write-Host ""
    Write-Host "Working on organization: $($org.name)" -ForegroundColor Magenta
    
    # Create projects
    foreach ($projectData in $projects) {
        $project = Create-TestProject -projectData $projectData -token $token -orgId $org.id
        
        if ($project) {
            # Create bugs for this project
            $bugCount = Get-Random -Minimum 3 -Maximum 8
            for ($i = 0; $i -lt $bugCount; $i++) {
                $bugTemplate = $bugTemplates | Get-Random
                $bugData = $bugTemplate.Clone()
                $bugData.title = "$($bugTemplate.title) #$($i + 1)"
                
                # Randomly assign to users from this organization
                $orgUsers = $users | Where-Object { $_.email -like "*@$($org.domain.Split('.')[0]).com" }
                $assignee = $orgUsers | Get-Random
                $assigneeUser = $createdUsers[$assignee.email]
                
                Create-TestBug -bugData $bugData -token $token -orgId $org.id -projectId $project.id -assigneeId $assigneeUser.id | Out-Null
            }
        }
    }
}

Write-Host ""
Write-Host "🎉 Test data generation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test Accounts Created:" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

foreach ($orgSlug in $createdOrgs.Keys) {
    $orgInfo = $createdOrgs[$orgSlug]
    Write-Host ""
    Write-Host "🏢 $($orgInfo.org.name) ($orgSlug)" -ForegroundColor Cyan
    
    $orgUsers = $users | Where-Object { $_.email -like "*@$($orgInfo.org.domain.Split('.')[0]).com" }
    foreach ($user in $orgUsers) {
        Write-Host "   User: $($user.email) / password123 ($($user.role))" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🧪 UI Testing Instructions:" -ForegroundColor Yellow
Write-Host "1. Login with any of the accounts above" -ForegroundColor Cyan
Write-Host "2. Test organization switching" -ForegroundColor Cyan
Write-Host "3. Test role-based permissions" -ForegroundColor Cyan
Write-Host "4. Test data isolation between orgs" -ForegroundColor Cyan
Write-Host "5. Test subscription limits and billing" -ForegroundColor Cyan
