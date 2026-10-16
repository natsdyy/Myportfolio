# AI Agent Guide

This repository is a Vue 3 portfolio with an AI chat assistant. Read
[`docs/ai/README.md`](docs/ai/README.md) before making changes.

## Fast Context

- The frontend is a Vue 3 + Vite single-page site in `src/`.
- Local development uses the Express app in `server/src/`.
- Vercel production uses functions in `api/`.
- Both AI deployments share `server/src/ai/`.
- Portfolio facts used by the assistant live in
  `server/src/data/knowledgeBase.js`.
- The chat UI and browser-side conversation analysis live in
  `src/components/common/chat/ChatWidget.vue` and
  `src/utils/chatAnalyzer.js`.

## Working Rules

- Preserve the module boundary: root/frontend files use ES modules; `server/`
  uses CommonJS.
- Keep local Express and Vercel behavior aligned when changing an endpoint.
  The AI endpoint already shares one handler; the contact endpoint has two
  separate implementations.
- Never commit `.env` files or expose secret values in client-side code.
- Update both the visible portfolio data in `src/components/sections/` and the
  assistant facts in `server/src/data/knowledgeBase.js` when personal or
  project information changes.
- Keep chat responses compatible with the SSE event contract documented in
  `docs/ai/ARCHITECTURE.md`.
- Avoid editing generated dependencies and build output (`node_modules/`,
  `dist/`).

## Validation

Run the focused chat tests and production build with:

```bash
npm test
npm run build
```

For endpoint changes, also run the local stack with `npm run dev` and check
`GET /health`, `POST /api/ai/chat`, and any changed route.
