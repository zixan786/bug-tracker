# Bug Tracker Deployment Script
param(
    [string]$DatabaseUrl = "",
    [string]$JwtSecret = "",
    [string]$BackendUrl = ""
)

Write-Host "🚀 Bug Tracker Deployment Helper" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if git is available
try {
    git --version | Out-Null
    Write-Host "✅ Git is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository. Please run this from your project root." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Pre-deployment Checklist:" -ForegroundColor Yellow
Write-Host "1. ✅ Create Supabase account and database" -ForegroundColor Cyan
Write-Host "2. ✅ Create Railway account" -ForegroundColor Cyan
Write-Host "3. ✅ Create Vercel account" -ForegroundColor Cyan
Write-Host "4. ✅ Push your code to GitHub" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 Configuration Files Created:" -ForegroundColor Yellow
Write-Host "- railway.json (Railway deployment config)" -ForegroundColor Cyan
Write-Host "- vercel.json (Vercel deployment config)" -ForegroundColor Cyan
Write-Host "- Dockerfile (Container deployment)" -ForegroundColor Cyan
Write-Host "- deployment-guide.md (Step-by-step guide)" -ForegroundColor Cyan

# Generate JWT secret if not provided
if ([string]::IsNullOrEmpty($JwtSecret)) {
    $JwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 10)
    Write-Host ""
    Write-Host "🔐 Generated JWT Secret:" -ForegroundColor Yellow
    Write-Host $JwtSecret -ForegroundColor Cyan
    Write-Host "⚠️  Save this secret! You'll need it for Railway environment variables." -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Environment Variables for Railway:" -ForegroundColor Yellow
Write-Host "NODE_ENV=production" -ForegroundColor Cyan
Write-Host "PORT=3001" -ForegroundColor Cyan
if (-not [string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Host "DATABASE_URL=$DatabaseUrl" -ForegroundColor Cyan
} else {
    Write-Host "DATABASE_URL=<your-supabase-connection-string>" -ForegroundColor Cyan
}
Write-Host "JWT_SECRET=$JwtSecret" -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 Environment Variables for Vercel:" -ForegroundColor Yellow
if (-not [string]::IsNullOrEmpty($BackendUrl)) {
    Write-Host "VITE_API_URL=$BackendUrl/api" -ForegroundColor Cyan
} else {
    Write-Host "VITE_API_URL=<your-railway-app-url>/api" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Push your code to GitHub:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m `"Add deployment configuration`"" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Railway:" -ForegroundColor Cyan
Write-Host "   - Go to railway.app" -ForegroundColor Gray
Write-Host "   - Create new project from GitHub repo" -ForegroundColor Gray
Write-Host "   - Add environment variables shown above" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to Vercel:" -ForegroundColor Cyan
Write-Host "   - Go to vercel.com" -ForegroundColor Gray
Write-Host "   - Import GitHub repository" -ForegroundColor Gray
Write-Host "   - Set root directory to frontend" -ForegroundColor Gray
Write-Host "   - Add VITE_API_URL environment variable" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Setup Supabase Database:" -ForegroundColor Cyan
Write-Host "   - Create account at supabase.com" -ForegroundColor Gray
Write-Host "   - Create new project" -ForegroundColor Gray
Write-Host "   - Copy connection string to Railway" -ForegroundColor Gray
Write-Host "   - Run database migrations" -ForegroundColor Gray

Write-Host ""
Write-Host "📖 For detailed instructions, see: deployment-guide.md" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Happy deploying!" -ForegroundColor Green
