# VolCall

Volatility-triggered phone call alerts — web app aligned with **VOLCALL PRD v1.0** (Phase 1).

**Product decisions, PRD gaps, and a file map:** see [docs/decisions.md](docs/decisions.md).

**Deploy on Vercel (connect GitHub, env vars, Postgres):** see [docs/vercel.md](docs/vercel.md).

## Stack

- **Next.js 15** (App Router), **React 19**, **Tailwind CSS 4**
- **Prisma** + **PostgreSQL** (required for Vercel; use Neon/Supabase/local Docker for dev)
- **bcrypt** passwords, **jose** JWT session cookie
- **Integrations** (opt-in via `.env`): **Resend** (email verification), **Twilio Verify** (SMS OTP), **Stripe Checkout** (subscription start + webhook), **Deribit** + **Redis** (alert worker). Without keys, the app falls back to the original demo paths (`000000` OTP, simulated checkout, etc.).

### Alert engine (separate process)

```bash
# Requires DATABASE_URL; optional REDIS_URL, Twilio voice vars — see .env.example
npm run alert-engine
```

Default **`ALERT_ENGINE_DRY_RUN=true`**: evaluates thresholds and writes `[dry-run]` `CallEvent` rows instead of placing voice calls.

### Stripe webhooks (local)

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward `checkout.session.completed` to `/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`.

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL (PostgreSQL), JWT_SECRET (min 16 chars), NEXT_PUBLIC_APP_URL, and any integration keys.

npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Local database:** use a free [Neon](https://neon.tech) branch, [Supabase](https://supabase.com), or `postgresql` in Docker — not a file-backed SQLite URL.

## Demo flows

1. **Sign up** — TCPA consent required; password rules: 8+ chars, one uppercase, one number.
2. **Onboarding** — Add phone (E.164, OTP **`000000`**), choose plan, simulate Stripe checkout, confirm activation.
3. **Dashboard / settings** — Subscription, call history (sample rows after activation), alert toggles, DND times.

**Email verification** — Production would send a link; demo: **Mark email verified** on step 1 or `POST /api/auth/verify-demo` while logged in.

## Scripts

| Command        | Description           |
| -------------- | --------------------- |
| `npm run dev`  | Dev server (Turbopack) |
| `npm run build`| Production build       |
| `npm run start`| Run production build   |
| `npx prisma db push` | Sync schema to DB |

## License

Private / internal per PRD.
