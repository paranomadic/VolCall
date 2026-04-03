# VolCall

Volatility-triggered phone call alerts — web app aligned with **VOLCALL PRD v1.0** (Phase 1).

**Product decisions, PRD gaps, and a file map:** see [docs/decisions.md](docs/decisions.md).

## Stack

- **Next.js 15** (App Router), **React 19**, **Tailwind CSS 4**
- **Prisma** + **SQLite** (local dev; use PostgreSQL in production)
- **bcrypt** passwords, **jose** JWT session cookie
- **Integrations** (Twilio, Stripe, Circle, Deribit, Resend) are **stubbed or demo**; wire real keys via environment variables when you connect services.

## Setup

```bash
cp .env.example .env
# Edit JWT_SECRET for production (min 16 characters).

npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
