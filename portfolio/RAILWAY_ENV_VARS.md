# Railway Environment Variables

Copy and paste these environment variables into Railway Dashboard → Your Service → Variables

## ALL ENVIRONMENT VARIABLES (Copy Everything Below)
```
VITE_GOOGLE_CLIENT_ID=772917032967-4g7ue9o35vmfa0sg9la9l0ijqn5bn8i4.apps.googleusercontent.com
VITE_API_BASE_URL=https://cladev.up.railway.app
VITE_RECAPTCHA_SITE_KEY=6LeQLw0sAAAAAJRLg2dc_KWfYx7g4KddAK-JRROi
ALLOWED_ORIGINS=${{shared.ALLOWED_ORIGINS}}
DATABASE_URL=${{Postgres-yF1a.DATABASE_URL}}
GOOGLE_CLIENT_ID=772917032967-4g7ue9o35vmfa0sg9la9l0ijqn5bn8i4.apps.googleusercontent.com
JWT_SECRET=5b0dde4a9259397af6d453242c2e56f25e1b71f5af8bb8aeef0081dab25885056b5e7aebf25ed593aea1722be16ec52cbb1187a57284cb08b86fcf0dbddee5fa
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
# Alternative: If port 587 doesn't work, try port 465 with SMTP_SECURE=true
# SMTP_PORT=465
# SMTP_SECURE=true
SMTP_USER=businessemail.charlesalvaran@gmail.com
SMTP_PASS=dlvnhfquecwgmzfw
SMTP_TO=businessemail.charlesalvaran@gmail.com
SMTP_FROM=businessemail.charlesalvaran@gmail.com
SMTP_FROM_NAME=Charles Louie Alvaran
RECAPTCHA_SECRET_KEY=6LeQLw0sAAAAAHJQNogxlPOGcnlecMeH1sk-ad9C
```

---

## Alternative: Raw Format (for Railway Raw Editor)

If using Railway's Raw Editor, paste this:

```
VITE_GOOGLE_CLIENT_ID="772917032967-4g7ue9o35vmfa0sg9la9l0ijqn5bn8i4.apps.googleusercontent.com"
VITE_API_BASE_URL="https://cladev.up.railway.app"
VITE_RECAPTCHA_SITE_KEY="6LeQLw0sAAAAAJRLg2dc_KWfYx7g4KddAK-JRROi"
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
SMTP_FROM="businessemail.charlesalvaran@gmail.com"
SMTP_FROM_NAME="Charles Louie Alvaran"
RECAPTCHA_SECRET_KEY="6LeQLw0sAAAAAHJQNogxlPOGcnlecMeH1sk-ad9C"
```

---

## Notes:
- `${{shared.ALLOWED_ORIGINS}}` - Create this in Railway Shared Variables first, or replace with actual value like: `https://cladev.up.railway.app,http://localhost:5173`
- `${{Postgres-yF1a.DATABASE_URL}}` - Auto-set when PostgreSQL service is linked, or replace with your database URL
- Frontend variables (`VITE_*`) must be set before building the Docker image
- Backend variables are used at runtime

