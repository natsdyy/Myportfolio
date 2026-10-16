# Change Guide

## Common Tasks

| Goal | Primary files | Also check |
| --- | --- | --- |
| Change name, bio, contact, or skills | `src/components/sections/*.vue` | `server/src/data/knowledgeBase.js` |
| Add or edit a project | `src/components/sections/Projects.vue` | `src/assets/`, `server/src/data/knowledgeBase.js` |
| Change site navigation | `src/components/layout/Header.vue` | section IDs, `Footer.vue`, `App.vue` |
| Change theme colors | `src/style.css` | `useTheme.js`, component dark classes |
| Change resume behavior | `ResumeModal.vue` | `useResumeModal.js`, public PDF, chat resume link |
| Change chat UI | `ChatWidget.vue` | `chatAnalyzer.js`, SSE contract |
| Change assistant facts | `server/src/data/knowledgeBase.js` | visible section data |
| Change Gemini behavior | `server/src/ai/systemPrompt.js` | `providers/gemini.js` |
| Change fallback answers | `fallback/localBrain.js` | `localAgent.js`, `personaEngine.js` |
| Change chat API contract | `server/src/ai/http.js` | `ChatWidget.vue`; wrappers usually stay thin |
| Change contact API | `api/contact.js` | Express route and email service |
| Add a frontend dependency | root `package.json` | Vercel shared imports |
| Add a server-only dependency | `server/package.json` | Docker/Railway install behavior |

## Environment Variables

Never place secrets in `VITE_*` variables because Vite embeds them in browser
code.

### AI

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Enables Gemini; without it the local fallback is used |
| `GEMINI_MODEL` | Optional model override; default is `gemini-flash-latest` |
| `GEMINI_GROUNDING` | Set to `false` to disable Google Search grounding |

### Server

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port, default `4000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist; empty allows all origins |
| `GOOGLE_CLIENT_ID` | Reserved server config value |
| `JWT_SECRET` | Reserved server config value; default is unsafe for production |
| `RECAPTCHA_SECRET_KEY` | Server-side reCAPTCHA verification secret |

### Email

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Enables Resend in the Express email service |
| `RESEND_FROM_EMAIL` | Sender address for Resend |
| `SMTP_HOST` | SMTP host, default `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port, default `587` |
| `SMTP_SECURE` | Use secure SMTP when set to `true` |
| `SMTP_USER` | SMTP login and fallback destination |
| `SMTP_PASS` | SMTP password/app password |
| `SMTP_FROM` | Optional sender address |
| `SMTP_FROM_NAME` | Display name for outgoing email |
| `SMTP_TO` | Contact-form destination |

### Browser

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google Identity client ID used by `useGoogleAuth.js` |
| `VITE_API_BASE_URL` | Referenced in Express email templates; not used by chat fetches |

## Data Consistency

Several facts intentionally or historically exist in more than one place:

- Visible portfolio projects are defined in `Projects.vue`.
- AI project facts are defined in `knowledgeBase.js`.
- Hero/about/skills text is defined directly in the matching Vue sections.
- Contact facts also appear in the assistant knowledge base.

When editing personal data, search the repository for the old value before
finishing. The backend knowledge base is the assistant's source of truth, but
it is not the frontend's source of truth.

## Current Caveats

- There is no Vue Router; navigation relies on section IDs and local state.
- There is no database. Contact messages are emailed and AI memory is
  process-local.
- The Vercel and Express contact implementations are separate and can drift.
- `useGoogleAuth.js` and `src/data/countries.js` are currently unused by the
  rendered app.
- The contact section contains links only; it does not submit to the contact
  endpoint.
- The largest maintenance hotspots are `ChatWidget.vue`, `localBrain.js`,
  `personaEngine.js`, and `emailService.js`.
- Some deployment comments/configuration mention older infrastructure details;
  verify deployment assumptions before changing hosting behavior.

## Safe Validation Checklist

1. Run `npm run build` for frontend and shared-import syntax checks.
2. For backend changes, start `npm run dev` and confirm `GET /health`.
3. Test chat in both streaming mode and `{ "stream": false }` mode when its
   contract changes.
4. Test with and without `GEMINI_API_KEY` when changing the AI pipeline.
5. Check both light and dark themes for UI changes.
6. Check mobile and desktop layouts for section or chat changes.
7. Verify both Vercel and Express contact paths after contact-contract changes.

