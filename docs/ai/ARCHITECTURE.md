# Architecture

## Frontend Runtime

`src/main.js` initializes the saved theme and mounts `src/App.vue`.
`App.vue` owns a small `currentPage` state instead of using Vue Router. The
normal `home` view renders all portfolio sections in order. Special values
render the custom `404` or `500` components.

The layout is split into:

- `components/layout/`: navigation and footer.
- `components/sections/`: hero, about, projects, skills, and contact content.
- `components/common/`: reusable UI, the resume modal, chat widget, and error
  screens.
- `composables/`: module-level shared state for theme, resume modal, and a
  currently unused Google Identity integration.
- `utils/chatAnalyzer.js`: browser-only keyword analysis used for chat badges,
  tone/topic detection, and suggested prompts. It does not generate answers.

Global styling is in `src/style.css`. Tailwind 4 is loaded through PostCSS,
while light/dark colors are implemented with CSS custom properties and a
custom dark variant.

## Navigation

This is a section-based SPA, not a route-based app. `Header.vue` scrolls to
section IDs such as `about`, `projects`, and `contact`. `App.vue`'s
`currentPage` is only used for the home and error-page states. Adding real URL
routes would require introducing router behavior rather than only adding a new
`currentPage` value.

## Chat Request Flow

```text
ChatWidget.vue
  -> POST /api/ai/chat { query, history, stream: true }
  -> server/src/ai/http.js
       -> validates input and rate limits by IP
       -> server/src/ai/index.js
            -> Gemini streaming provider
            -> localAgent fallback
  <- Server-Sent Events (SSE)
  -> render Markdown
  -> sanitize HTML with DOMPurify
  -> persist completed messages in localStorage
```

### Shared Deployments

- Local: `server/src/routes/aiRoutes.js` mounts the shared handler at
  `/api/ai/chat` through Express.
- Vercel: `api/ai/chat.js` directly exports the same shared handler.

Do not duplicate AI request logic in either wrapper. Change
`server/src/ai/http.js` for transport behavior and `server/src/ai/index.js` for
provider/fallback behavior.

### Chat Request Contract

```json
{
  "query": "string, required, maximum 1000 characters",
  "history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ],
  "stream": true
}
```

The server keeps at most 12 valid history messages and truncates each message
to 2,000 characters. The widget also sends at most 12 prior messages.

Streaming is the default. Each SSE event contains one JSON payload:

```text
data: {"type":"delta","text":"partial response"}
data: {"type":"done","sources":[],"mode":"ai"}
data: {"type":"error","message":"safe user-facing error"}
```

With `stream: false`, the response is JSON:

```json
{
  "answer": "complete response",
  "sources": [{ "label": "Source", "url": "https://example.com" }],
  "mode": "ai"
}
```

Possible modes are `ai`, `local`, `search`, and `memory`.

The HTTP layer enforces 15 requests per IP per minute using in-memory buckets
and aborts work after 30 seconds. This limiter is per process/serverless
instance and is not a global production limit.

## AI Pipeline

`server/src/ai/index.js` is the provider boundary:

1. Sanitize conversation history.
2. Derive conversation state: visitor type, goal, language, active subject,
   formality, follow-up status, and desired response depth.
3. If Gemini is configured, build the system prompt from the knowledge base
   and derived conversation state.
4. Stream Gemini output, optionally with Google Search grounding.
5. If Gemini fails before emitting text, run the local agent.
6. If Gemini fails after emitting text, keep the partial answer and append a
   cut-off note instead of repeating the response.

The Gemini provider uses the REST API directly and does not use a Gemini SDK.
It retries once without grounding when a grounded request fails.

### Local Fallback

`server/src/ai/fallback/localAgent.js` orchestrates this sequence:

1. Resolve follow-up questions against recent history.
2. Build a conversation profile.
3. Check the process-local answer cache.
4. Ask for clarification when rules mark the query as ambiguous.
5. Try the intent-based portfolio brain.
6. Search selected public sources for unmatched general queries.
7. Synthesize an answer and apply persona rules.
8. Cache the result in memory.

The scraper router chooses among DuckDuckGo HTML results (the file is named
`google.js`), Wikipedia, Reddit, and Dictionary API. Cache contents disappear
when the server process restarts.

## Contact Flow

There are two separate contact implementations:

- `server/src/routes/contact.js` + `server/src/services/emailService.js` for
  Express/Railway. This path supports Resend first and SMTP fallback.
- `api/contact.js` for Vercel. This is a standalone Nodemailer implementation.

Both expect `POST /api/contact` with:

```json
{
  "recaptchaToken": "required",
  "name": "optional",
  "email": "required",
  "subject": "optional",
  "message": "required"
}
```

Both return HTTP `201` after processing, including `emailSent` and optional
`emailError` fields. Because these implementations are separate, contract or
validation changes must be applied to both unless they are intentionally
deployment-specific.

## State and Persistence

- Theme: `localStorage['theme']`.
- Chat messages: `localStorage['cla-chat-history-v2']`, maximum 40 completed
  messages.
- Google auth draft: `localStorage['google_auth_state']`.
- Resume modal: shared in-memory Vue ref from `useResumeModal.js`.
- Local-agent answer memory: server process memory only, maximum 500 entries
  with a five-minute TTL. Only context-free requests use the shared cache.

There is no database in the current project.
