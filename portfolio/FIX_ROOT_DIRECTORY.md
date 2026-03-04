# Fix: Missing script "start" Error

## The Problem
Railway is trying to run `npm start` from the **root directory** instead of the `server/` directory.

This means the **Root Directory** setting isn't working correctly.

---

## Solution 1: Verify Root Directory in Railway (RECOMMENDED)

1. **Go to Railway** → Your Backend Service
2. **Settings** → **Source** (or **General**)
3. **Check "Root Directory"** field
4. **It should say**: `server` (exactly, no slash, no quotes)
5. **If it's empty or wrong:**
   - Type: `server`
   - Save
   - Redeploy

---

## Solution 2: Use Explicit Start Command (BACKUP)

I've updated `server/railway.json` to use `cd server && npm start` as a backup.

But **Solution 1 is better** - make sure Root Directory is set correctly.

---

## Step-by-Step Fix

### Step 1: Check Root Directory
1. Railway → Backend Service → **Settings**
2. Look for **"Root Directory"** or **"Source"** section
3. Should be: `server`

### Step 2: If Empty or Wrong
1. Click to edit
2. Type: `server` (no quotes, no slash)
3. Save
4. Railway will auto-redeploy

### Step 3: Verify It Works
1. Check **Logs** tab
2. Should see: `Server listening on port XXXX`
3. No more "Missing script: start" errors

---

## Why This Happens

Railway needs to know which folder to use as the "root" for your service. If Root Directory isn't set:
- Railway uses the repository root
- Tries to run `npm start` from root `package.json`
- Root `package.json` doesn't have `start` script
- Error: "Missing script: start"

When Root Directory is set to `server`:
- Railway uses `server/` as root
- Runs `npm start` from `server/package.json`
- `server/package.json` has `start` script
- ✅ Works!

---

## After Fixing

Once Root Directory is set correctly:
1. Railway will redeploy automatically
2. Check logs - should see "Server listening"
3. Backend should be accessible
4. Test: `https://YOUR-BACKEND-DOMAIN/health`


