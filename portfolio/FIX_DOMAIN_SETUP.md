# Fix: Frontend and Backend Domain Setup

## Current Situation

You're seeing the backend at `cladev.up.railway.app`, but this should be your **frontend** domain.

## The Correct Setup

You need **2 separate services** with **2 separate domains**:

1. **Frontend Service** → `cladev.up.railway.app` (your portfolio website)
2. **Backend Service** → `server-production-xxxx.up.railway.app` (API server)

---

## Step 1: Check Your Services in Railway

1. Go to Railway → Your Project
2. You should see **2 services**:
   - **Portfolio** (frontend)
   - **Server** (backend)

---

## Step 2: Assign Domains Correctly

### Frontend Service (Portfolio)
1. Click on **Portfolio** service
2. **Settings** → **Networking**
3. **Domain should be**: `cladev.up.railway.app`
4. If it's not, click **"Generate Domain"** or **"Add Domain"**
5. Set it to `cladev.up.railway.app` (or generate a new one)

### Backend Service (Server)
1. Click on **Server** service
2. **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Railway will create: `server-production-xxxx.up.railway.app`
5. **Copy this domain** - you'll need it!

---

## Step 3: Update Frontend to Use Backend Domain

1. Go to **Portfolio** service → **Variables**
2. Find `VITE_API_BASE_URL`
3. Update it to your **backend domain**:
   ```
   VITE_API_BASE_URL="https://server-production-xxxx.up.railway.app"
   ```
   (Replace with your actual backend domain)
4. Save
5. Railway will auto-redeploy frontend

---

## Step 4: Verify Everything Works

### Test Frontend
- Visit: `https://cladev.up.railway.app`
- Should show: Your portfolio website (Hero, About, Projects, etc.)

### Test Backend
- Visit: `https://server-production-xxxx.up.railway.app/health`
- Should return: `{"status":"ok"}`

### Test Contact Form
- Go to Contact page on your portfolio
- Try sending a message
- Should work! ✅

---

## Why This Setup?

- **Frontend** serves your Vue.js website (HTML, CSS, JavaScript)
- **Backend** serves your API (handles contact form, auth, etc.)
- They need separate domains because:
  - Different services
  - Different ports
  - Different deployment processes

---

## Quick Checklist

- [ ] Frontend service has domain: `cladev.up.railway.app`
- [ ] Backend service has its own domain: `server-xxxx.up.railway.app`
- [ ] Frontend `VITE_API_BASE_URL` points to backend domain
- [ ] Frontend shows your portfolio website
- [ ] Backend `/health` endpoint works
- [ ] Contact form works

---

## If Backend Took Over Frontend Domain

If `cladev.up.railway.app` is showing the backend:

1. **Check which service has this domain:**
   - Go to each service → Settings → Networking
   - See which one has `cladev.up.railway.app`

2. **Reassign domains:**
   - Remove `cladev.up.railway.app` from backend service
   - Add it to frontend service
   - Generate new domain for backend

3. **Update `VITE_API_BASE_URL`** to new backend domain

---

## Summary

- **Frontend**: `cladev.up.railway.app` → Shows your portfolio
- **Backend**: `server-xxxx.up.railway.app` → Handles API requests
- **Frontend calls backend** via `VITE_API_BASE_URL`

Both work together, but on different domains! 🚀

