# AI Codebase Guide

This folder is the quick-start knowledge base for AI assistants and new
contributors working on CLA.dev.

## Project Summary

CLA.dev is Charles Louie Alvaran's portfolio. It is a Vue 3 single-page site
with responsive portfolio sections, light/dark themes, a resume modal, and a
streaming AI chat assistant.

The project supports two backend runtimes:

1. During local development, Vite proxies `/api` to an Express server on port
   `4000`.
2. On Vercel, files under `api/` are serverless functions. The AI function
   imports the same core handler used by Express.

The assistant tries Gemini first when `GEMINI_API_KEY` is configured. If the
key is absent or Gemini fails before returning text, it uses a local rule-based
agent that can answer from portfolio data or scrape selected public sources.

## Technology Stack

| Area | Main technology |
| --- | --- |
| Frontend | Vue 3 Composition API, Vite 7 |
| Styling | Tailwind CSS 4, DaisyUI, CSS custom properties |
| Icons | Lucide Vue Next |
| Chat rendering | Marked + DOMPurify |
| Local backend | Express 5, CommonJS |
| Production backend | Vercel serverless functions |
| AI | Gemini REST streaming + local fallback engine |
| Email | Nodemailer; local server can also use Resend |
| Deploy configs | Vercel, Railway, Docker |

## Read These Next

- [ARCHITECTURE.md](ARCHITECTURE.md) explains runtime flows and API contracts.
- [FILE_MAP.md](FILE_MAP.md) explains every important directory and file.
- [CHANGE_GUIDE.md](CHANGE_GUIDE.md) maps common tasks to the correct files and
  records current caveats.

## Quick Start

```bash
npm install
npm --prefix server install
npm run dev
```

This starts Vite at `http://localhost:5173` and Express at
`http://localhost:4000`. Vite forwards `/api/*` requests to Express.

To build only the frontend:

```bash
npm run build
```

Focused chat regression tests use Node's built-in test runner:

```bash
npm test
```

There is no lint script at the time this guide was created.

## Mental Model

```text
Browser
  -> Vue sections and shared components
  -> /api/ai/chat
       -> shared HTTP/SSE handler
       -> Gemini when configured
       -> local agent when Gemini is unavailable
  -> /api/contact
       -> reCAPTCHA verification
       -> email provider
```

The contact section currently shows direct contact links only. It does not
call `/api/contact`, so the contact API is available backend functionality that
is not wired to the current UI.
