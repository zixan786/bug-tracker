# Simple GitHub Push Script
Write-Host "🚀 Pushing Bug Tracker to GitHub" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if git is available
try {
    git --version | Out-Null
    Write-Host "✅ Git is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Install from: https://git-scm.com" -ForegroundColor Red
    exit 1
}

# Initialize git repository
Write-Host ""
Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add all files
Write-Host "📁 Adding files..." -ForegroundColor Yellow
git add .

# Show status
Write-Host ""
Write-Host "📊 Files to be committed:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host ""
Write-Host "💾 Committing files..." -ForegroundColor Yellow
git commit -m "Initial commit: Bug tracker with enhanced status dropdown functionality"

Write-Host ""
Write-Host "✅ Local repository ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Yellow
Write-Host "1. Create repository on GitHub:" -ForegroundColor Cyan
Write-Host "   - Go to https://github.com/new" -ForegroundColor Gray
Write-Host "   - Name: bug-tracker" -ForegroundColor Gray
Write-Host "   - Make it public" -ForegroundColor Gray
Write-Host "   - Don't initialize with README (we have one)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Connect and push:" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/bug-tracker.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Your bug tracker will be live on GitHub!" -ForegroundColor Green
