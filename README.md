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
# Edit .env and add your GEMINI_API_KEY

# 3. Run in development
npm run dev
```

App runs at `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio key — [get one here](https://aistudio.google.com/) |
| `OPENROUTER_API_KEY` | No | Fallback provider key |
| `ALLOWED_ORIGINS` | No | CORS whitelist for production (comma-separated URLs) |
| `NODE_ENV` | No | Set to `production` when deploying |

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
