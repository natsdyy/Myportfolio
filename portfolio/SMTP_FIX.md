# SMTP Connection Fix

## Issue Found
The test endpoint returned: **"SMTP connection failed. Could not connect to smtp.gmail.com:587"**

This means Railway cannot connect to Gmail's SMTP server on port 587. This could be due to:
- Railway blocking outbound connections on port 587
- Network/firewall restrictions
- Port configuration issue

## Solution: Switch to Port 465 (SSL)

Gmail supports two SMTP ports:
- **Port 587** (TLS) - May be blocked by Railway
- **Port 465** (SSL) - More likely to work

### Steps to Fix:

1. **Update Railway Environment Variables:**

   Go to Railway Dashboard → Your Service → Variables

   Change these two variables:
   ```
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

   Instead of:
   ```
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

2. **Redeploy your service** in Railway

3. **Test again:**
   ```powershell
   Invoke-WebRequest -Uri "https://cladev.up.railway.app/api/test-email" -Method POST
   ```

4. **Check your email** after successful test

## Alternative: Use Railway's Email Service

If Gmail SMTP still doesn't work, Railway offers email services or you could:
- Use SendGrid (free tier available)
- Use Resend (free tier available)
- Use Mailgun (free tier available)

Let me know if you want to switch to one of these services instead.

