# Single Domain Setup - Frontend + Backend on Same Domain

## ✅ What I Changed

I've configured your backend to **serve the frontend** so everything works on **one domain**: `cladev.up.railway.app`

---

## How It Works

1. **Backend builds the frontend** during deployment
2. **Backend serves frontend files** from `/dist` folder
3. **Backend handles API routes** at `/api/*`
4. **Everything on one domain**: `cladev.up.railway.app`

---

## What Changed

### 1. Backend Now Serves Frontend
- Backend checks if `dist/` folder exists
- If yes: Serves frontend static files
- API routes still work at `/api/*`
- All other routes serve `index.html` (for Vue router)

### 2. Build Process
- Railway builds frontend first: `cd .. && npm install && npm run build`
- Then starts backend server
- Backend serves the built frontend files

### 3. Frontend API Calls
- If `VITE_API_BASE_URL` is not set, uses same origin
- API calls go to: `/api/*` (same domain)
- No CORS issues!

---

## Setup Steps

### Step 1: Keep Backend Service Only
1. **Delete or disable frontend service** in Railway (if you have one)
2. **Keep only the backend service**
3. **Backend service should have domain**: `cladev.up.railway.app`

### Step 2: Update Environment Variables
In backend service → Variables:

**Remove or leave empty:**
- `VITE_API_BASE_URL` (not needed - uses same origin)

**Keep these:**
```
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

### Step 3: Verify Root Directory
- Backend service → Settings → Source
- **Root Directory should be**: `server`
- This is correct! ✅

### Step 4: Deploy
1. **Commit and push** the changes
2. Railway will:
   - Build frontend (`npm run build` in root)
   - Start backend server
   - Backend serves frontend + API

---

## How It Works

### Request Flow:
1. User visits: `https://cladev.up.railway.app`
   - Backend serves `index.html` (frontend)

2. Frontend loads: `https://cladev.up.railway.app/assets/...`
   - Backend serves static files (CSS, JS, images)

3. API call: `https://cladev.up.railway.app/api/contact`
   - Backend handles API route

4. Vue Router navigation: `https://cladev.up.railway.app/about`
   - Backend serves `index.html` (Vue router handles it)

---

## Benefits

✅ **One domain** - Everything on `cladev.up.railway.app`
✅ **No CORS issues** - Same origin
✅ **Simpler setup** - One service instead of two
✅ **Easier deployment** - One deploy process

---

## Testing

1. **Visit**: `https://cladev.up.railway.app`
   - Should show your portfolio website

2. **Test API**: `https://cladev.up.railway.app/api/health`
   - Should return: `{"status":"ok"}`

3. **Test Contact Form**:
   - Go to Contact page
   - Send a message
   - Should work! ✅

---

## Troubleshooting

### Frontend not showing?
- Check logs: Backend should show "Serving frontend from dist/"
- Verify `dist/` folder exists after build
- Check build logs for errors

### API not working?
- Check logs: Should see "Routes registered"
- Test: `https://cladev.up.railway.app/api/health`
- Verify environment variables are set

### Build failing?
- Check Root Directory is set to `server`
- Verify frontend `package.json` has `build` script
- Check Railway build logs

---

## Summary

- ✅ Backend serves frontend
- ✅ Everything on one domain
- ✅ API routes work at `/api/*`
- ✅ No separate frontend service needed
- ✅ Simpler deployment

Perfect for your use case! 🚀

