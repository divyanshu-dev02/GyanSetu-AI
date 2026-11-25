# Deploying GyanSetu AI to Vercel

## 1. Prerequisites
- A Vercel account (`vercel.com`)
- A Google Gemini API key (`GEMINI_API_KEY`) — optional if running with `DEMO_MODE=true`
- Optional: Upstash Redis / Vercel KV (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) for persistent runtime state across serverless invocations (falls back to in-memory store if omitted)

## 2. Environment Variables (Vercel Project Settings)
Configure these **server-side** environment variables (never prefix secrets with `NEXT_PUBLIC_`):

| Variable | Required | Default / Example | Notes |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Optional (required for live AI) | `AIza...` | If omitted, app automatically uses `DEMO_MODE` fixtures |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model ID for function calling & vision |
| `DEMO_MODE` | No | `false` | Set `"true"` to force deterministic demo fixtures |
| `UPSTASH_REDIS_REST_URL` | No | `https://...upstash.io` | Optional KV store URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | `AX...` | Optional KV store token |

## 3. Deploy Steps
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repository in Vercel (`New Project`).
3. Keep Framework Preset as **Next.js**.
4. Add the environment variables above in **Settings → Environment Variables**.
5. Deploy — `vercel.json` pins serverless functions to **`bom1` (Mumbai)** with `maxDuration: 60`.
6. Verify `/api/health` returns `{ "ok": true, "service": "gyansetu-ai", ... }` with no secrets exposed.

---

## 4. Pre-Demo QA Checklist
- [ ] **Health Check**: `GET /api/health` returns `200 OK` without leaking any API keys.
- [ ] **Student Flow (EN / HI / KN)**:
  - [ ] Switch student (`Aarav`, `Diya`, `Karthik`) and language (`English`, `हिन्दी`, `ಕನ್ನಡ`).
  - [ ] Click **Run demo scenario (physics fail → retry)** and verify live SSE trace steps stream into the Agent Trace panel.
  - [ ] Submit 1/3 on the first quiz -> verify **"Let me try a different way"** banner and adaptive retry with a different analogy and easier quiz.
  - [ ] Submit 2/3 or 3/3 -> verify level-up banner.
- [ ] **Image Upload**: Attach or capture a photo -> verify client-side compression (`< 1 MB`, max 1280px JPEG) and preview thumbnail.
- [ ] **Teacher Flow (`/teacher`)**:
  - [ ] Click **Generate Smart Lesson Plan** -> verify live SSE trace, Recharts mastery bar chart, top misconceptions list, 45-min plan, Copy, Download PDF, and **Reset demo data**.
- [ ] **Responsive & Accessibility**:
  - [ ] Check `390px` mobile (trace accordion collapsed, 44px touch targets, 16px+ inputs) and `1280px` desktop (sticky trace sidebar).
  - [ ] Toggle light/dark mode.
- [ ] **PWA & Security**:
  - [ ] `/manifest.json` and `/sw.js` load cleanly; `/api/*` requests are never cached by the service worker.
  - [ ] `npm run build` and `npm run lint` pass with 0 errors.
