# Railway Backend Service Setup Guide

## ✅ Same Repository, Two Services

**You already have the correct structure!**
- Frontend: Root folder (`/`)
- Backend: `server/` folder

Both will deploy from the **same GitHub repository** - just different root directories!

---

## Step-by-Step Instructions

### Step 1: Create Backend Service

1. **Go to Railway Dashboard**
   - Open [railway.app](https://railway.app)
   - Log in to your account
   - Select your project (the one with your Portfolio frontend)
   - You should see your existing frontend service

2. **Add New Service**
   - Click the **"+"** button (usually in the top right or in the services list)
   - Select **"GitHub Repo"** or **"Deploy from GitHub repo"**
   - **IMPORTANT**: Choose the **SAME repository** you're already using for the frontend
   - Railway will create a new service in the same project

3. **Configure Service Settings**
   - After the service is created, click on it to open settings
   - Go to **Settings** tab
   - Scroll down to find **"Root Directory"** or **"Source"** section
   - **Set Root Directory to**: `server` (type exactly: `server`)
   - This tells Railway to only deploy the `server/` folder, not the entire repo
   - **This is the key step!** Without this, Railway will try to deploy the frontend code

4. **Name Your Service** (Optional but recommended)
   - In Settings → General, you can rename it to "Server" or "API" for clarity
   - This helps distinguish it from your frontend service
   - Your project will now have 2 services:
     - Portfolio (frontend) - Root: `/`
     - Server (backend) - Root: `server/`

### Step 2: Configure Build Settings

Railway should auto-detect Node.js, but verify:

1. **Check Build Settings**
   - In the service Settings → **Build**
   - It should show:
     - **Builder**: NIXPACKS (auto-detected)
     - **Start Command**: `npm start` (from your package.json)
   - If not, set Start Command to: `npm start`

### Step 3: Add Environment Variables

1. **Go to Variables Tab**
   - In your backend service, click **Variables** tab
   - Click **"New Variable"** for each one below

2. **Add These Variables** (copy and paste each):

```env
ALLOWED_ORIGINS="${{shared.ALLOWED_ORIGINS}}"
```

```env
DATABASE_URL="${{Postgres-yF1a.DATABASE_URL}}"
```

```env
GOOGLE_CLIENT_ID="772917032967-4g7ue9o35vmfa0sg9la9l0ijqn5bn8i4.apps.googleusercontent.com"
```

```env
JWT_SECRET="5b0dde4a9259397af6d453242c2e56f25e1b71f5af8bb8aeef0081dab25885056b5e7aebf25ed593aea1722be16ec52cbb1187a57284cb08b86fcf0dbddee5fa"
```

```env
SMTP_HOST="smtp.gmail.com"
```

```env
SMTP_PORT="587"
```

```env
SMTP_SECURE="false"
```

```env
SMTP_USER="businessemail.charlesalvaran@gmail.com"
```

```env
SMTP_PASS="dlvnhfquecwgmzfw"
```

```env
SMTP_TO="businessemail.charlesalvaran@gmail.com"
```

```env
SMTP_FROM_NAME="Lithauzs Mart"
```

```env
RECAPTCHA_SECRET_KEY="6LeQLw0sAAAAAHJQNogxlPOGcnlecMeH1sk-ad9C"
```

**Note**: For `ALLOWED_ORIGINS` and `DATABASE_URL`, you're using Railway's shared variables. Make sure those exist in your project's shared variables.

### Step 4: Generate Backend Domain

1. **Go to Networking**
   - In your backend service, click **Settings** → **Networking**
   - Or look for **"Public Networking"** section

2. **Generate Domain**
   - Click **"Generate Domain"** button
   - Railway will create a unique domain like: `server-production-xxxx.up.railway.app`
   - **Copy this domain** - you'll need it in the next step!

### Step 5: Update Frontend to Use Backend

1. **Go to Your Frontend Service**
   - In Railway, find your Portfolio/Frontend service
   - Click on it

2. **Update Environment Variable**
   - Go to **Variables** tab
   - Find `VITE_API_BASE_URL`
   - Update it to your backend domain:
     ```
     VITE_API_BASE_URL="https://YOUR-BACKEND-DOMAIN.up.railway.app"
     ```
   - Replace `YOUR-BACKEND-DOMAIN` with the actual domain from Step 4

3. **Redeploy Frontend**
   - Railway should auto-redeploy when you change variables
   - Or manually trigger a redeploy from the **Deployments** tab

### Step 6: Verify It Works

1. **Check Backend Health**
   - Visit: `https://YOUR-BACKEND-DOMAIN.up.railway.app/health`
   - Should return: `{"status":"ok"}`

2. **Test Contact Form**
   - Go to your portfolio site
   - Try sending a message through the contact form
   - Should work without 405 error!

## Troubleshooting

### Backend won't start
- Check **Logs** tab in Railway for errors
- Verify all environment variables are set correctly
- Make sure `Root Directory` is set to `server`

### Still getting 405 error
- Verify `VITE_API_BASE_URL` in frontend points to backend domain (not frontend)
- Check that backend service is actually running (green status)
- Clear browser cache and try again

### Database connection errors
- Verify `DATABASE_URL` is set correctly
- Check that your Postgres service is running

## Quick Checklist

- [ ] Backend service created
- [ ] Root Directory set to `server`
- [ ] All environment variables added
- [ ] Backend domain generated
- [ ] Frontend `VITE_API_BASE_URL` updated to backend domain
- [ ] Backend service is running (green status)
- [ ] Frontend redeployed
- [ ] Contact form tested and working

