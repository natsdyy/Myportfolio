# Troubleshooting: API Endpoint Not Found

## Quick Checks

### ✅ Step 1: Is Backend Service Running?

1. Go to Railway → Your Project
2. Check if you have **2 services**:
   - Portfolio (frontend)
   - Server/API (backend)
3. Click on the **backend service**
4. Check the status:
   - ✅ **Green/Active** = Running
   - ❌ **Red/Error** = Not running (check logs)

**If backend is not running:**
- Go to **Logs** tab
- Look for errors
- Common issues:
  - Missing environment variables
  - Database connection error
  - Port binding error

---

### ✅ Step 2: Does Backend Have a Domain?

1. In backend service → **Settings** → **Networking**
2. Check if there's a domain listed
3. If not, click **"Generate Domain"**
4. **Copy the domain** (e.g., `server-production-xxxx.up.railway.app`)

**Test the domain:**
- Visit: `https://YOUR-BACKEND-DOMAIN.up.railway.app/health`
- Should return: `{"status":"ok"}`
- If you get an error, backend isn't accessible

---

### ✅ Step 3: Is VITE_API_BASE_URL Correct?

1. Go to **Portfolio service** → **Variables**
2. Find `VITE_API_BASE_URL`
3. Check the value:
   - ❌ **Wrong**: `https://cladev.up.railway.app` (this is frontend!)
   - ✅ **Correct**: `https://YOUR-BACKEND-DOMAIN.up.railway.app`

**If it's wrong:**
- Update it to your backend domain
- Save
- Railway will auto-redeploy frontend

---

### ✅ Step 4: Check Backend Logs

1. Backend service → **Logs** tab
2. Look for:
   - `Server listening on port XXXX`
   - Any error messages
   - Database connection status

**Common errors:**
- `DATABASE_URL is not configured` → Add DATABASE_URL variable
- `Port already in use` → Railway handles this automatically
- `Missing environment variable` → Add missing variables

---

### ✅ Step 5: Verify Environment Variables

In backend service → **Variables**, make sure you have ALL of these:

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

---

### ✅ Step 6: Test Backend Directly

1. Open browser
2. Visit: `https://YOUR-BACKEND-DOMAIN.up.railway.app/health`
3. Expected response: `{"status":"ok"}`

**If this doesn't work:**
- Backend isn't running or accessible
- Check logs for errors
- Verify domain is generated

**If this works:**
- Backend is running correctly
- Problem is with frontend configuration
- Check VITE_API_BASE_URL again

---

## Common Issues & Solutions

### Issue: "405 Method Not Allowed"
**Cause**: Frontend is calling frontend domain instead of backend
**Fix**: Update `VITE_API_BASE_URL` to backend domain

### Issue: "404 Not Found"
**Cause**: Backend route doesn't exist or backend isn't running
**Fix**: Check backend logs, verify routes are registered

### Issue: "CORS error"
**Cause**: Backend ALLOWED_ORIGINS doesn't include frontend domain
**Fix**: Add frontend domain to ALLOWED_ORIGINS

### Issue: Backend won't start
**Cause**: Missing environment variables or database connection
**Fix**: Check logs, add missing variables

---

## Quick Test Commands

Test backend health:
```bash
curl https://YOUR-BACKEND-DOMAIN.up.railway.app/health
```

Test contact endpoint (from browser console):
```javascript
fetch('https://YOUR-BACKEND-DOMAIN.up.railway.app/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
```

---

## Still Not Working?

Share these details:
1. Backend service status (green/red?)
2. Backend domain URL
3. VITE_API_BASE_URL value (from frontend variables)
4. Backend logs (any errors?)
5. Health endpoint response (does `/health` work?)

