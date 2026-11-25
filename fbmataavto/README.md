# FB Mata Avto (`/fbmataavto`)

Dashboard for Facebook ad auto-launch (Akimova Pride). UI lives at **`/fbmataavto`**, not on `/`. Later on kodaoslab.com it should be `kodaoslab.com/fbmataavto`.

## Local

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000/fbmataavto`. Identity is simulated on this machine.

## Env (dashboard)

- `LIMONAD_API_KEY` — Limonad `X-Token` (sample stats if unset)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` — default `1540072090`
- `PC_AGENT_TOKEN` — shared with the PC agent
- `TELEGRAM_WEBHOOK_SECRET` — optional webhook header
- `DATABASE_URL` — set by Cursor hosting when the app has Postgres

Never commit secrets. Do not use the Facebook Ads API.

PC agent: see `pc-agent/README.md`.
