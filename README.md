# CLA.dev — Portfolio

Vue 3 + Vite portfolio with an AI assistant, deployed on **Vercel**.

> AI assistants and contributors: start with [`AGENTS.md`](AGENTS.md) and the
> maintained [`docs/ai/`](docs/ai/) codebase guide.

## Project structure

```
├── api/                      Vercel serverless functions (production backend)
│   ├── ai/chat.js            → POST /api/ai/chat  (thin wrapper over server/src/ai/http.js)
│   └── contact.js            → POST /api/contact
├── server/                   Express server for local dev (same AI code as Vercel)
│   ├── .env.example          All environment variables
│   └── src/
│       ├── index.js          Express app
│       ├── routes/           aiRoutes.js, contact.js
│       ├── data/
│       │   └── knowledgeBase.js   ← single source of truth about Charles (edit this!)
│       └── ai/
│           ├── index.js           Pipeline: Gemini first, local fallback second
│           ├── http.js            Shared request handler (validation, rate limit, SSE streaming)
│           ├── systemPrompt.js    Persona + facts sent to Gemini
│           ├── providers/gemini.js
│           └── fallback/          Rule-based brain + web scrapers (no API key needed)
├── src/                      Vue frontend
│   ├── components/{layout,sections,common}
│   ├── composables/
│   └── assets/
├── public/                   Static files (resume PDF, legal pages)
└── docs/AI_Information.docx  Assistant behaviour guidelines (source for systemPrompt.js)
```

## AI assistant

1. Get a free Gemini API key at <https://aistudio.google.com/apikey>.
2. **Vercel:** Project → Settings → Environment Variables → add `GEMINI_API_KEY`, then redeploy.
3. **Local:** `cp server/.env.example server/.env` and fill in `GEMINI_API_KEY`.

Without a key (or if Gemini is down) the assistant automatically falls back to the built-in rule-based brain.

To change what the assistant knows, edit [`server/src/data/knowledgeBase.js`](server/src/data/knowledgeBase.js).
To change how it behaves, edit [`server/src/ai/systemPrompt.js`](server/src/ai/systemPrompt.js).

## Development

```bash
npm install
npm --prefix server install
npm run dev        # Vite (5173) + Express API (4000), /api is proxied
```
