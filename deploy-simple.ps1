# Bug Tracker Deployment Helper
Write-Host "🚀 Bug Tracker Deployment Helper" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Generate JWT secret
$JwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 10)

Write-Host ""
Write-Host "🔐 Generated JWT Secret:" -ForegroundColor Yellow
Write-Host $JwtSecret -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Environment Variables for Railway:" -ForegroundColor Yellow
Write-Host "NODE_ENV=production" -ForegroundColor Cyan
Write-Host "PORT=3001" -ForegroundColor Cyan
Write-Host "DATABASE_URL=<your-supabase-connection-string>" -ForegroundColor Cyan
Write-Host "JWT_SECRET=$JwtSecret" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Environment Variables for Vercel:" -ForegroundColor Yellow
Write-Host "VITE_API_URL=<your-railway-app-url>/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Create Supabase account at supabase.com" -ForegroundColor Cyan
Write-Host "2. Create Railway account at railway.app" -ForegroundColor Cyan
Write-Host "3. Create Vercel account at vercel.com" -ForegroundColor Cyan
Write-Host "4. Push code to GitHub" -ForegroundColor Cyan
Write-Host "5. Deploy backend to Railway" -ForegroundColor Cyan
Write-Host "6. Deploy frontend to Vercel" -ForegroundColor Cyan
Write-Host ""

Write-Host "📖 See deployment-guide.md for detailed instructions" -ForegroundColor Green
