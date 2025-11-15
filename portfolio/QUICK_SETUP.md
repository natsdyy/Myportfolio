# Quick Railway Backend Setup

## 🎯 Goal
Deploy backend from `server/` folder in the same repository as your frontend.

---

## Step 1: Create Backend Service (2 minutes)

1. Go to [railway.app](https://railway.app) → Your Project
2. Click **"+"** button → **"GitHub Repo"**
3. Select **SAME repository** as your frontend
4. Click the new service → **Settings** → **Source**
5. Set **Root Directory**: `server`
6. Save

✅ Now you have 2 services:
- **Portfolio** (frontend) - deploys from root
- **Server** (backend) - deploys from `server/` folder

---

## Step 2: Add Environment Variables (3 minutes)

In your **backend service** → **Variables** tab, add these:

```env
ALLOWED_ORIGINS="${{shared.ALLOWED_ORIGINS}}"
DATABASE_URL="${{Postgres-yF1a.DATABASE_URL}}"
GOOGLE_CLIENT_ID="772917032967-4g7ue9o35vmfa0sg9la9l0ijqn5bn8i4.apps.googleusercontent.com"
JWT_SECRET="5b0dde4a9259397af6d453242c2e56f25e1b71f5af8bb8aeef0081dab25885056b5e7aebf25ed593aea1722be16ec52cbb1187a57284cb08b86fcf0dbddee5fa"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="businessemail.charlesalvaran@gmail.com"
SMTP_PASS="dlvnhfquecwgmzfw"
SMTP_TO="businessemail.charlesalvaran@gmail.com"
SMTP_FROM_NAME="Charles Louie Alvaran"
RECAPTCHA_SECRET_KEY="6LeQLw0sAAAAAHJQNogxlPOGcnlecMeH1sk-ad9C"
```

**How to add:**
- Click **"New Variable"** for each one
- Paste the variable name in **Name** field
- Paste the value in **Value** field
- Click **Add**

---

## Step 3: Get Backend Domain (1 minute)

1. In backend service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. **Copy the domain** (e.g., `server-production-xxxx.up.railway.app`)

---

## Step 4: Update Frontend (1 minute)

1. Go to **Portfolio service** → **Variables**
2. Find `VITE_API_BASE_URL`
3. Change it to your backend domain:
   ```
   VITE_API_BASE_URL="https://YOUR-BACKEND-DOMAIN.up.railway.app"
   ```
4. Replace `YOUR-BACKEND-DOMAIN` with the domain from Step 3

---

## Step 5: Test (1 minute)

1. Wait for both services to deploy (green ✅ status)
2. Visit: `https://YOUR-BACKEND-DOMAIN.up.railway.app/health`
   - Should show: `{"status":"ok"}`
3. Try your contact form - should work! 🎉

---

## ⚠️ Troubleshooting

**Backend won't start?**
- Check **Logs** tab for errors
- Verify Root Directory is set to `server` (not `/`)
- Make sure all environment variables are added

**Still 405 error?**
- Double-check `VITE_API_BASE_URL` points to backend domain
- Clear browser cache
- Make sure backend service is running (green status)

---

## ✅ Checklist

- [ ] Backend service created
- [ ] Root Directory set to `server`
- [ ] All 12 environment variables added
- [ ] Backend domain generated
- [ ] Frontend `VITE_API_BASE_URL` updated
- [ ] Both services deployed (green status)
- [ ] Health check works (`/health` endpoint)
- [ ] Contact form tested

---

**Total time: ~8 minutes** ⏱️

