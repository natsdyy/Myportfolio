# Check Deployment Logs

## The build succeeded, but the app isn't responding

This means the server might be crashing on startup. Let's check the logs.

---

## Step 1: Check Backend Service Logs

1. **Go to Railway** → Your Project
2. **Click on your backend service** (Server/API)
3. **Go to "Logs" tab** (or "Deployments" → Latest deployment → View logs)
4. **Look for these messages:**

### ✅ Good Signs (Server is running):
```
Server listening on port XXXX
[server] Routers loaded successfully
Database connected
```

### ❌ Bad Signs (Server crashed):
```
[server] Failed to start
Error: DATABASE_URL is not configured
Error: Cannot connect to database
Missing environment variable
```

---

## Step 2: Common Issues & Fixes

### Issue 1: Database Connection Error
**Error in logs:**
```
Error: connect ECONNREFUSED
DATABASE_URL is not configured
```

**Fix:**
- Go to backend service → Variables
- Make sure `DATABASE_URL` is set to: `${{Postgres-yF1a.DATABASE_URL}}`
- Redeploy

### Issue 2: Missing Environment Variables
**Error in logs:**
```
Missing required environment variable: XXXX
```

**Fix:**
- Add the missing variable to backend service → Variables
- Redeploy

### Issue 3: Server Crashes on Startup
**Error in logs:**
```
[server] Failed to start
Error: ...
```

**Fix:**
- Check what the error says
- Usually it's a missing env variable or database issue

---

## Step 3: Verify Backend is Running

1. **Check service status:**
   - Backend service should show **green/active**
   - If red, check logs

2. **Check if backend has a domain:**
   - Settings → Networking
   - Should have a domain like: `server-production-xxxx.up.railway.app`

3. **Test backend health:**
   - Visit: `https://YOUR-BACKEND-DOMAIN.up.railway.app/health`
   - Should return: `{"status":"ok"}`
   - If this doesn't work, backend isn't running

---

## Step 4: What to Share

Please share:
1. **Backend service logs** (from Logs tab)
   - Look for errors or "Server listening" message
2. **Backend service status** (green or red?)
3. **Backend domain** (if it exists)
4. **Does `/health` endpoint work?** (when you visit it)

This will help me identify the exact issue!

