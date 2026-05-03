# Testing VolCall locally

## Run the web app

```bash
npm install
# Set neon_storage_POSTGRES_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL in .env
npx prisma db push
npm run dev
```

Open `http://localhost:3000`, sign up, and walk through onboarding (or use **Admin → Grant comp** after configuring admin access).

## Admin access

1. Set **`ADMIN_EMAILS`** in `.env` to your login email (comma-separated for multiple), **or**
2. Run `npx prisma studio` and set **`isAdmin = true`** on your `User` row.

Then open **`/admin`** while logged in. Use **App flow tests** at the top for quick checks:

1. **Call test** — **`POST /api/admin/trigger-call`**
2. **Payment test** — **`POST /api/admin/payment-test`** (`action`: `status` | `simulate_checkout` | `hosted_checkout`)
3. **DVOL read test** — **`POST /api/admin/dvol-read`** (Deribit BTC/ETH, bands vs saved thresholds)

You can also adjust **global DVOL thresholds**, **grant comp**, and deep tools below that.

## Alert engine worker

In another terminal (same `.env` as the app):

```bash
npm run alert-engine
```

- **`ALERT_ENGINE_DRY_RUN=true`** (default): logs would-be calls and writes `[dry-run]` rows; no Vapi/Twilio.
- Set **`ALERT_ENGINE_DRY_RUN=false`** and configure **Vapi** or **Twilio** to place real calls.

The worker polls Deribit DVOL about every 60s and uses thresholds from the **`SystemSettings`** table (created when you first save in Admin or on first engine tick).

## Payments and SMS

Optional: configure Lemon Squeezy, Stripe, Resend, Twilio Verify per `.env.example`. Without them, the app uses demo paths (simulated checkout, OTP `000000`).
