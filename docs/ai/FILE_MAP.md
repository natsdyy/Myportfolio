# File Map

## Root

| Path | Responsibility |
| --- | --- |
| `index.html` | Vite HTML entry, Google Identity script, app mount node |
| `package.json` | Frontend dependencies and combined development scripts |
| `vite.config.js` | Vue plugin and local `/api` proxy to port 4000 |
| `src/style.css` | Tailwind import, theme variables, global utilities |
| `tailwind.config.js` | Content paths, class-based dark mode, DaisyUI |
| `postcss.config.js` | Tailwind 4 PostCSS plugin |
| `vercel.json` | AI function timeout and SPA rewrite rules |
| `README.md` | Public project setup overview |
| `AGENTS.md` | Short automatic entry point for coding agents |

## Frontend: `src/`

| Path | Responsibility |
| --- | --- |
| `main.js` | Initializes theme and mounts Vue |
| `App.vue` | Top-level layout and simple page/error state |
| `components/layout/Header.vue` | Desktop/mobile navigation, active section, theme toggle |
| `components/layout/Footer.vue` | Footer navigation and scroll-to-top action |
| `components/sections/Hero.vue` | Intro copy, social links, headline stats |
| `components/sections/About.vue` | Biography and highlight cards |
| `components/sections/Projects.vue` | Visible project arrays, tabs, and pagination |
| `components/sections/Skills.vue` | Skill categories and technology logo loop |
| `components/sections/Contact.vue` | Direct email, phone, and social links |
| `components/common/ResumeModal.vue` | Embedded resume preview and download |
| `components/common/LogoLoop.vue` | Reusable animated technology-logo strip |
| `components/common/chat/ChatWidget.vue` | Chat UI, persistence, SSE parsing, Markdown rendering |
| `components/common/error/NotFound.vue` | In-app 404 state |
| `components/common/error/ServerError.vue` | In-app 500 state |
| `composables/useTheme.js` | Shared dark-mode state and persistence |
| `composables/useResumeModal.js` | Shared resume-modal state |
| `composables/useGoogleAuth.js` | Google Identity helper; currently not imported elsewhere |
| `utils/chatAnalyzer.js` | Client-side topics, tone, language, badges, suggestions |
| `data/countries.js` | Country/phone helpers; currently not imported elsewhere |
| `assets/` | Images imported by portfolio components |

The visible project catalog in `Projects.vue` is separate from the assistant's
project knowledge in `server/src/data/knowledgeBase.js`.

## Production Functions: `api/`

| Path | Responsibility |
| --- | --- |
| `api/ai/chat.js` | Thin Vercel wrapper around the shared AI HTTP handler |
| `api/contact.js` | Standalone Vercel reCAPTCHA and SMTP contact handler |

Root `package.json` must include every dependency imported by these Vercel
functions or by their shared imports.

## Local/Standalone Backend: `server/`

| Path | Responsibility |
| --- | --- |
| `src/index.js` | Express app, CORS, health/debug routes, static SPA serving |
| `src/config.js` | Loads `server/.env` and exposes basic server config |
| `src/routes/aiRoutes.js` | Mounts shared chat handler |
| `src/routes/contact.js` | Express contact validation and orchestration |
| `src/services/emailService.js` | Resend/SMTP email delivery and OTP email helper |
| `src/data/knowledgeBase.js` | Canonical assistant facts about Charles and projects |
| `src/ai/systemPrompt.js` | Builds Gemini instructions from the knowledge base |
| `src/ai/index.js` | Gemini-first generation pipeline and fallback switch |
| `src/ai/http.js` | Shared validation, timeout, rate limit, JSON/SSE transport |
| `src/ai/providers/gemini.js` | Gemini REST streaming and grounding retry |
| `src/ai/fallback/localAgent.js` | Local fallback orchestrator and result synthesis |
| `src/ai/fallback/localBrain.js` | Intent rules and portfolio-specific responses |
| `src/ai/fallback/conversationContext.js` | Follow-up resolution and conversation profiles |
| `src/ai/fallback/personaEngine.js` | Tone, empathy, consistency, and response-shaping rules |
| `src/ai/fallback/memory.js` | Process-local answer cache |
| `src/ai/fallback/scraping/` | DuckDuckGo, Wikipedia, Reddit, and dictionary clients |
| `Dockerfile` | Standalone backend image |
| `railway.json` | Railway start/restart configuration |

## Public and Documentation Files

| Path | Responsibility |
| --- | --- |
| `public/Charles_Louie_Alvaran_Resume.pdf` | Resume served at a stable public URL |
| `public/privacy.html` | Static privacy page |
| `public/terms.html` | Static terms page |
| `public/404.html` | Static hosting fallback page |
| `docs/AI_Information.docx` | Existing non-code assistant reference document |
| `docs/ai/` | Maintained Markdown context for coding agents |

