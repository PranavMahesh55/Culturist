# Vercel Deployment Guide for Culturis

## Prerequisites
1. **Vercel Account**: Sign up at https://vercel.com (free)
2. **GitHub Repository**: Your code should be on GitHub (✅ already done)
3. **API Keys**: Have your Qloo and OpenAI API keys ready

## Step 1: Deploy Backend (FastAPI)

### 1.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Deploy Backend
```bash
cd backend
vercel
```

Follow the prompts:
- **Set up and deploy**: `Y`
- **Which scope**: Select your account
- **Link to existing project**: `N`
- **Project name**: `culturis-backend`
- **Directory**: `.` (current directory)
- **Want to override settings**: `N`

### 1.3 Add Environment Variables to Backend
After deployment, add environment variables in Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select your `culturis-backend` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
QLOO_API_KEY = your_qloo_api_key_here
OPENAI_API_KEY = your_openai_api_key_here
MONGODB_URI = your_mongodb_connection_string
ENVIRONMENT = production
ALLOWED_ORIGINS = ["https://your-frontend-url.vercel.app"]
```

### 1.4 Redeploy Backend
```bash
vercel --prod
```

**Note your backend URL**: https://culturis-backend-xxx.vercel.app

## Step 2: Deploy Frontend (React)

### 2.1 Deploy Frontend
```bash
cd ../culturis-studio
vercel
```

Follow the prompts:
- **Set up and deploy**: `Y`
- **Which scope**: Select your account
- **Link to existing project**: `N`
- **Project name**: `culturis-frontend` or `culturis`
- **Directory**: `.` (current directory)
- **Want to override settings**: `N`

### 2.2 Add Environment Variables to Frontend
In Vercel dashboard for your frontend project:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
REACT_APP_API_BASE_URL = https://your-backend-url.vercel.app
REACT_APP_ENVIRONMENT = production
REACT_APP_ENABLE_DEBUG = false
REACT_APP_ENABLE_ANALYTICS = true
```

### 2.3 Update Backend CORS
Update your backend's `ALLOWED_ORIGINS` environment variable to include your frontend URL:

```
ALLOWED_ORIGINS = ["https://your-frontend-url.vercel.app"]
```

### 2.4 Redeploy Frontend
```bash
vercel --prod
```

## Step 3: Final Configuration

### 3.1 Update Backend CORS (Important!)
1. Go to your backend project in Vercel dashboard
2. Update `ALLOWED_ORIGINS` environment variable with your actual frontend URL:
   ```
   ALLOWED_ORIGINS = ["https://culturis-frontend-xxx.vercel.app"]
   ```
3. Redeploy backend: `vercel --prod`

### 3.2 Test Your Deployment
Visit your frontend URL and test:
- ✅ Page loads correctly
- ✅ "Choose your tastes" works (backend connection)
- ✅ Map loads with venues
- ✅ Chat functionality works

## Alternative: One-Click Deploy

### Option A: Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Deploy as two separate projects (backend and frontend)
4. Configure environment variables in dashboard

### Option B: Deploy Both at Once
Create a `vercel.json` in root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "culturis-studio/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "backend/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "culturis-studio/index.html"
    }
  ]
}
```

## Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Make sure `ALLOWED_ORIGINS` includes your frontend URL
- Redeploy backend after updating CORS settings

#### 2. API Not Found (404)
- Verify backend deployment is successful
- Check `REACT_APP_API_BASE_URL` points to correct backend URL

#### 3. Environment Variables Not Working
- Make sure variables are set in Vercel dashboard
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

#### 4. Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `requirements.txt` or `package.json`

### Useful Commands:
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm project-name
```

## Expected URLs:
- **Frontend**: https://culturis-frontend-xxx.vercel.app
- **Backend**: https://culturis-backend-xxx.vercel.app
- **API Docs**: https://culturis-backend-xxx.vercel.app/docs

Your Culturis app will be live and accessible worldwide! 🌍
