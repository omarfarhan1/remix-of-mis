# MIS — Marketing Intelligence System

A sequential AI-powered marketing pipeline for building company positioning, offers, and customer avatars step by step.

## Architecture

```
client (React + Vite)  →  Express server  →  Gemini API (primary)
                                          →  OpenRouter API (fallback)
```

**4 stages:**
1. **Company Profile** — Name, industry, specializations, USP
2. **Offer Builder** — AI-generated offer copy with scoring
3. **Empathy Architect** — Deep customer avatar generation via multi-agent pipeline
4. **Strategic Scaling** — Growth playbooks per avatar

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Open .env and paste your GEMINI_API_KEY
#   → Get one (free) at https://aistudio.google.com/

# 3. Run in development
npm run dev
```

App runs at `http://localhost:3000`.

### Local AI Setup

This project talks **directly** to Gemini (and optionally OpenRouter) from your
own Express server — there is no Lovable-hosted AI proxy or hidden gateway
involved in local development.

1. Create a Gemini API key at <https://aistudio.google.com/>.
2. Put it in `.env` as `GEMINI_API_KEY=...`.
3. Restart `npm run dev`.
4. Verify: `curl http://localhost:3000/api/health` should report
   `"ai": { "gemini": true }`.

If the key is missing, the UI still loads but every `/api/ai/*` request
returns HTTP `503` with `type: "AI_NOT_CONFIGURED"` and a human-readable
message. No silent failures, no fake responses.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes (unless OpenRouter is set) | Google AI Studio key — [get one here](https://aistudio.google.com/) |
| `OPENROUTER_API_KEY` | No | Optional primary/fallback provider key |
| `ALLOWED_ORIGINS` | No | CORS whitelist for production (comma-separated URLs) |
| `NODE_ENV` | No | Set to `production` when deploying (missing `GEMINI_API_KEY` becomes fatal) |

## Production Build

```bash
npm run build
npm start
```

## Key Technical Features

- **Circuit Breaker** — Automatic failover from OpenRouter → Gemini on provider failures
- **Request Deduplication** — Identical concurrent requests merged into one API call
- **IndexedDB Storage** — Compressed client-side persistence (bypasses 5MB localStorage limit)
- **Multi-Agent Avatar Pipeline** — Advocate + Skeptic + Researcher → Synthesis → Adversarial Probe → Score Gate
- **Rate Limiting** — Per-IP global limit (200/15min) + per-client AI limit (30/min)
- **Zod Validation** — All API endpoints validated at runtime
