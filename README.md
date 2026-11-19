# Paperwork Explainer

An Android app (iPhone later) for family caregivers. Photograph hospital, insurance, or medical paperwork and get:

- a plain-English explanation
- a "Don't miss this" warning for deadlines
- a to-do list
- questions for the doctor
- definitions of confusing terms
- a draft appeal letter for denials

| Folder | What it is |
|---|---|
| `mobile/` | The Android app (Expo / React Native) |
| `backend/` | The server: reads the documents with Claude, enforces the usage limits, and keeps the API key off the phone |
| `docs/market-research.md` | The research behind the idea |

## Put the backend online (about 15 minutes, free to start)

1. **Get an API key.** Go to [console.anthropic.com](https://console.anthropic.com) and create an API key. Add about $5 of credit.
2. **Set a hard spending cap.** In the same console, under **Settings → Limits**, set a monthly spend limit (for example $20). This is the firm ceiling, whatever happens.
3. **Import the repo.** Sign in at [vercel.com](https://vercel.com) with GitHub, click **Add New → Project**, import this repo, and set **Root Directory** to `backend`.
4. **Add environment variables:**
   - `ANTHROPIC_API_KEY`: your key
   - `APP_KEY`: any long random text (the app sends this to prove it's your app)
5. **Deploy**, and copy the address it gives you.
6. **Turn on shared limits.** In the Vercel project, open **Storage → Upstash (Redis)** and create the free database. This makes the daily limits hold across all servers. Then click **Redeploy**.

Then build the app: see [mobile/README.md](mobile/README.md).

## Cost protection

| Protection | Default | Change it with |
|---|---|---|
| Documents per phone per day | 5 | `LIMIT_PER_DEVICE_PER_DAY` |
| Documents per network per day | 15 | `LIMIT_PER_IP_PER_DAY` |
| Documents for the whole app per day | 200 (about $10–20) | `LIMIT_GLOBAL_PER_DAY` |
| Pages per request | 5 photos or a 10-page PDF | in code |
| Requests without the app key | blocked | `APP_KEY` |
| Monthly spend ceiling | set in the Anthropic console | console.anthropic.com |

Without an API key, the backend runs in **demo mode** and returns a sample result for free.

---

This app explains paperwork. It is not medical, legal, or financial advice.
