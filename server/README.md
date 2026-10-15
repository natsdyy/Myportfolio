# Backend (local dev)

Express server used for local development. In production, Vercel runs the
functions in `../api/`, which import the same code from `src/ai/`.

```bash
npm install
cp .env.example .env   # add GEMINI_API_KEY etc.
npm run dev            # http://localhost:4000
```

## Endpoints

- `POST /api/ai/chat` — `{ query, history?, stream? }` → SSE stream (or JSON when `stream: false`)
- `POST /api/contact` — contact form email
- `GET /health`

See the root [README](../README.md) for the full project structure.
