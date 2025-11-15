# Setup Resend Email Service (Recommended for Railway)

Since Railway is blocking SMTP connections, Resend is a better solution. It uses HTTP APIs instead of SMTP, so it works perfectly with Railway.

## Why Resend?

- ✅ **Works with Railway** - Uses HTTP API, not SMTP
- ✅ **Free tier** - 3,000 emails/month free
- ✅ **Easy setup** - Just need an API key
- ✅ **Better deliverability** - Professional email infrastructure

## Quick Setup (5 minutes)

### 1. Sign up for Resend

Go to [https://resend.com](https://resend.com) and sign up (it's free).

### 2. Get your API Key

1. After signing up, go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name like "Portfolio Server"
4. Copy the API key (starts with `re_`)

### 3. Add to Railway

Go to Railway Dashboard → Your Service → Variables

Add these two variables:

```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Note:** For testing, you can use `onboarding@resend.dev` as the from email. Later, you can verify your own domain for better deliverability.

### 4. Redeploy

Railway will automatically redeploy when you save the variables.

### 5. Test

```powershell
Invoke-WebRequest -Uri "https://cladev.up.railway.app/api/test-email" -Method POST
```

You should now receive emails! ✅

## How It Works

The code automatically:
1. **Checks for `RESEND_API_KEY`** first
2. If found, uses Resend API (HTTP - works with Railway)
3. If not found, falls back to SMTP (won't work on Railway)

## Verify Your Domain (Optional)

For production, verify your domain:
1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Add your domain (e.g., `cladev.up.railway.app`)
3. Add the DNS records Resend provides
4. Once verified, update `RESEND_FROM_EMAIL` to use your domain:
   ```
   RESEND_FROM_EMAIL=noreply@cladev.up.railway.app
   ```

## Troubleshooting

- **Not receiving emails?** Check spam folder
- **API key invalid?** Make sure you copied the full key (starts with `re_`)
- **Rate limit?** Free tier allows 3,000 emails/month

## Alternative Services

If you prefer other services:
- **SendGrid** - Similar HTTP API, free tier available
- **Mailgun** - HTTP API, free tier available
- **Postmark** - Transactional emails, free tier available

All work the same way - just need an API key instead of SMTP credentials!

