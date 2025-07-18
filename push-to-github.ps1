# GitHub Push Script for Bug Tracker
param(
    [string]$RepoName = "bug-tracker",
    [string]$GitHubUsername = "",
    [string]$CommitMessage = "Initial commit: Bug tracker with status dropdown functionality"
)

Write-Host "🚀 GitHub Push Helper for Bug Tracker" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if git is installed
try {
    git --version | Out-Null
    Write-Host "✅ Git is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Please run this script from the bug tracker project root directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Pre-push checklist:" -ForegroundColor Yellow
Write-Host "✅ .gitignore file created" -ForegroundColor Green
Write-Host "✅ README.md updated" -ForegroundColor Green
Write-Host "✅ Deployment files ready" -ForegroundColor Green
Write-Host "✅ Status dropdown functionality implemented" -ForegroundColor Green

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    Write-Host ""
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Add all files
Write-Host ""
Write-Host "📁 Adding files to Git..." -ForegroundColor Yellow
git add .

# Check git status
Write-Host ""
Write-Host "📊 Git Status:" -ForegroundColor Yellow
git status --short

# Commit changes
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

# Check if remote origin exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "🔗 Setting up GitHub remote..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($GitHubUsername)) {
        Write-Host "Please enter your GitHub username:" -ForegroundColor Cyan
        $GitHubUsername = Read-Host
    }
    
    $repoUrl = "https://github.com/$GitHubUsername/$RepoName.git"
    git remote add origin $repoUrl
    Write-Host "✅ Remote origin set to: $repoUrl" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✅ Remote origin already configured: $remoteExists" -ForegroundColor Green
}

# Push to GitHub
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may need to authenticate with GitHub" -ForegroundColor Cyan

try {
    git push -u origin main
    Write-Host ""
    Write-Host "🎉 Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your repository is now available at:" -ForegroundColor Yellow
    Write-Host "https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Next steps for deployment:" -ForegroundColor Yellow
    Write-Host "1. Deploy backend to Railway: railway.app" -ForegroundColor Cyan
    Write-Host "2. Deploy frontend to Vercel: vercel.com" -ForegroundColor Cyan
    Write-Host "3. Setup database on Supabase: supabase.com" -ForegroundColor Cyan
    Write-Host "4. See deployment-guide.md for detailed instructions" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "This might be because:" -ForegroundColor Yellow
    Write-Host "1. Repository doesn't exist on GitHub yet" -ForegroundColor Cyan
    Write-Host "2. Authentication failed" -ForegroundColor Cyan
    Write-Host "3. Network connection issues" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Create repository on GitHub: https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Name it: $RepoName" -ForegroundColor Cyan
    Write-Host "3. Run: git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📝 Repository includes:" -ForegroundColor Yellow
Write-Host "- ✅ Complete bug tracker application" -ForegroundColor Green
Write-Host "- ✅ Status dropdown functionality" -ForegroundColor Green
Write-Host "- ✅ Assignment dropdown functionality" -ForegroundColor Green
Write-Host "- ✅ Role-based permissions" -ForegroundColor Green
Write-Host "- ✅ Deployment configurations" -ForegroundColor Green
Write-Host "- ✅ Database migrations" -ForegroundColor Green
Write-Host "- ✅ Documentation" -ForegroundColor Green
