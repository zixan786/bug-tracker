# 🚀 Bug Tracker - Free Deployment Guide

## Overview
Deploy your bug tracker application completely free using:
- **Database**: Supabase (PostgreSQL) - Free tier
- **Backend**: Railway - Free tier  
- **Frontend**: Vercel - Free tier

## Step 1: Setup Supabase Database (FREE)

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Create a new project:
   - **Name**: `bugtracker-db`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
   - Click "Create new project"

### 1.2 Get Database Connection Details
1. Go to **Settings** → **Database**
2. Copy these values:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (the one you created)

### 1.3 Get Connection String
1. In **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It looks like: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`

## Step 2: Setup Railway Backend (FREE)

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your GitHub account
6. Select your bug tracker repository

### 2.2 Configure Environment Variables
1. In Railway dashboard, click your project
2. Go to **Variables** tab
3. Add these environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   ```

### 2.3 Configure Build Settings
1. In Railway, go to **Settings**
2. Set **Build Command**: `cd backend && npm install && npm run build`
3. Set **Start Command**: `cd backend && npm start`
4. Set **Root Directory**: `/`

## Step 3: Setup Vercel Frontend (FREE)

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your bug tracker repository
5. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Configure Environment Variables
1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
   (Replace with your Railway backend URL)

## Step 4: Database Migration

### 4.1 Run Migrations on Supabase
1. In Supabase dashboard, go to **SQL Editor**
2. Run your database schema (copy from your local migrations)
3. Or connect locally and run migrations:
   ```bash
   DATABASE_URL="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres" npm run migrate
   ```

## Step 5: Testing Deployment

### 5.1 Test Backend
1. Visit your Railway URL: `https://your-app.railway.app/api/health`
2. Should return: `{"status":"OK","timestamp":"..."}`

### 5.2 Test Frontend
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try logging in with admin credentials
3. Test bug creation and status changes

## Free Tier Limits

### Supabase (Database)
- ✅ 500MB database storage
- ✅ 2GB bandwidth per month
- ✅ 50MB file uploads
- ✅ 50,000 monthly active users

### Railway (Backend)
- ✅ $5 credit per month (enough for small apps)
- ✅ 512MB RAM
- ✅ 1GB disk
- ✅ Custom domains

### Vercel (Frontend)
- ✅ 100GB bandwidth per month
- ✅ Unlimited static sites
- ✅ Custom domains
- ✅ Automatic HTTPS

## Troubleshooting

### Common Issues
1. **CORS Errors**: Add your Vercel domain to backend CORS settings
2. **Database Connection**: Check Supabase connection string
3. **Build Failures**: Check Node.js version compatibility
4. **Environment Variables**: Ensure all variables are set correctly

### Logs
- **Railway**: Check logs in Railway dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **Supabase**: Check logs in Supabase dashboard

## Cost Optimization
- All services have generous free tiers
- Monitor usage in each dashboard
- Upgrade only when needed
- Consider caching strategies for better performance

## Security Notes
- Use strong JWT secrets
- Enable RLS (Row Level Security) in Supabase
- Use environment variables for all secrets
- Enable HTTPS everywhere (automatic with these services)
