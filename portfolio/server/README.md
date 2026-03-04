# Backend Service

Simple Express API that verifies Google ID tokens, stores authenticated users in
Postgres, and saves contact form messages.

## Setup

1. Install dependencies
   ```bash
   cd server
   npm install
   ```
2. Copy `env.example` to `.env` and fill in your values:
   ```
   PORT=4000
   DATABASE_URL=postgres://user:password@host:port/db
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ALLOWED_ORIGINS=https://cladev.up.railway.app,http://localhost:5173
   ```
3. Start the server
   ```bash
   npm run dev
   ```

## API

### `POST /api/contact`

Body:
```json
{
  "idToken": "GOOGLE_ID_TOKEN",
  "subject": "optional subject",
  "message": "your message"
}
```

The server verifies the Google token, upserts the user, stores the message, and
returns the saved record.

