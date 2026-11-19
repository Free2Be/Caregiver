# Paperwork Explainer

Family caregivers upload a photo or PDF of medical or insurance paperwork and get back:

- a plain-English explanation
- an urgent-deadline warning when there is one
- a to-do checklist
- costs and coverage in plain terms
- questions to ask the doctor
- definitions of confusing terms
- a draft appeal letter for denials

Files are sent to Claude to be read and are never stored.

Market research behind the idea: [docs/market-research.md](docs/market-research.md)

## Run it on your computer

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. In this folder, run:
   ```bash
   npm install
   cp .env.example .env.local   # then paste your key into .env.local
   npm run dev
   ```
3. Open http://localhost:3000.

**Demo mode:** without an `ANTHROPIC_API_KEY`, the app runs in demo mode and shows a sample result, so you can try the flow before getting a key. Get a key at https://console.anthropic.com.

## Put it online (free)

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New → Project** and import this repo.
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY`.
4. Click **Deploy**. You get a public link in about a minute.

## How it works

| File | What it does |
|---|---|
| `app/page.tsx` | Upload page and results |
| `app/api/explain/route.ts` | Sends the files to Claude and checks the answer |
| `lib/prompt.ts` | Instructions for Claude (tone, safety rules, what to fill in) |
| `lib/schema.ts` | The exact shape of every answer |
| `lib/sample.ts` | The sample result used in demo mode |

**Model:** the app uses `claude-opus-5-5` by default, at about 5–10 cents per document. To use a cheaper model, set `CLAUDE_MODEL=claude-sonnet-5-5`.

**Fallback:** if Claude declines a request, a server-side fallback retries it automatically on another model.

## Not built yet

- [ ] Free limit (3 documents a month) and paid plan
- [ ] Share link for family members
- [ ] Usage analytics

---

This tool explains paperwork. It is not medical, legal, or financial advice.
