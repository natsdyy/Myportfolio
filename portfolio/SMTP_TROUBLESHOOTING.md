# SMTP Email Troubleshooting Guide

## Quick Fixes for Email Not Sending

### 1. Verify Gmail App Password Setup

**Your current password:** `dlvnhfquecwgmzfw` (16 characters - looks correct!)

**Steps to verify/create App Password:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Make sure **2-Step Verification** is enabled (required for App Passwords)
3. Go to **App Passwords** section
4. If you already have one:
   - Verify it matches: `dlvnhfquecwgmzfw`
   - If different, update `SMTP_PASS` in Railway
5. If you need a new one:
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other" → Type "Portfolio Server"
   - Click "Generate"
   - Copy the 16-character password (no spaces)
   - Update `SMTP_PASS` in Railway

### 2. Check Railway Environment Variables

Add/Verify these in Railway → Your Service → Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=businessemail.charlesalvaran@gmail.com
SMTP_PASS=<your-16-char-app-password>
SMTP_TO=businessemail.charlesalvaran@gmail.com  ← ADD THIS!
SMTP_FROM=businessemail.charlesalvaran@gmail.com
SMTP_FROM_NAME=Lithauzs Mart
```

### 3. Test SMTP Connection

**Option A: Use the test endpoint**
```bash
curl -X POST https://cladev.up.railway.app/api/test-email
```

**Option B: Check Railway Logs**
1. Go to Railway → Your Service → Deploy Logs
2. Submit a contact form
3. Look for `[email-service]` and `[contact]` log entries
4. Check for error messages like:
   - "SMTP authentication failed" → Password issue
   - "SMTP connection failed" → Network/host issue
   - "Email was rejected" → Email address issue

### 4. Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EAUTH` or `535` | Authentication failed | Use Gmail App Password, not regular password |
| `ECONNECTION` | Can't connect to SMTP | Check `SMTP_HOST` and `SMTP_PORT` |
| Email accepted but not received | Email in spam | Check spam folder |
| Email rejected | Invalid recipient | Verify `SMTP_TO` email address |

### 5. Verify Email is Being Sent

Check Railway logs for these success messages:
```
[email-service] SMTP connection verified successfully
[email-service] Email sent successfully: { messageId: '...', accepted: [...] }
```

If you see errors instead, the logs will show the exact problem.

## Testing Steps

1. **Add `SMTP_TO` variable** in Railway
2. **Verify App Password** is correct (16 characters, no spaces)
3. **Submit a test contact form**
4. **Check Railway logs** for email-related errors
5. **Check spam folder** in Gmail
6. **Use test endpoint** if still having issues: `POST /api/test-email`

