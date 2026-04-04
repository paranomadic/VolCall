# Deploy VolCall on Vercel

You connect the GitHub repo in the **Vercel dashboard** (this cannot be done from code alone). This doc lists the exact clicks and the settings VolCall expects.

## 1. Connect GitHub to Vercel

1. Sign in at [vercel.com](https://vercel.com).
2. **Add New… → Project**.
3. **Import** your Git repository  
   `https://github.com/paranomadic/VolCall`  
   (authorize the Vercel GitHub App if asked).
4. Vercel should detect **Next.js** automatically.

### Project settings (defaults are fine)

| Setting | Value |
|--------|--------|
| Framework Preset | Next.js |
| Root Directory | `./` (repo root) |
| Build Command | `npm run build` (default) |
| Output Directory | (leave default) |
| Install Command | `npm install` (default; runs `postinstall` → `prisma generate`) |

## 2. Database (required)

Vercel serverless **cannot** use a local SQLite file for durable storage. Use a hosted Postgres (for example [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)).

1. Create a database and copy the **connection string** (SSL usually required).
2. In Vercel → your project → **Settings → Environment Variables**, add:

   **`DATABASE_URL`** = `postgresql://...` (your provider’s URL)

3. After the first deploy, apply the schema **once** from your laptop (or CI) against that same URL:

   ```bash
   export DATABASE_URL="postgresql://..."
   npx prisma db push
   ```

   For production long-term, switch to [Prisma Migrate](https://www.prisma.io/docs/guides/migrate) instead of `db push`.

## 3. Required app environment variables

Add these under **Settings → Environment Variables** (Production + Preview as you prefer). See `.env.example` for the full list.

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | At least 16 characters. |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://your-project.vercel.app` (no trailing slash). Used for email links and Stripe redirects. |

Optional integrations (same names as local):

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `TWILIO_*`, `STRIPE_*`, `REDIS_URL`, etc.

Redeploy after changing env vars (**Deployments → … → Redeploy**).

## 4. Stripe webhooks (production)

Point Stripe at your live URL:

- **Endpoint URL:** `https://YOUR_DOMAIN/api/stripe/webhook`
- **Events:** at minimum `checkout.session.completed`
- Put the signing secret in **`STRIPE_WEBHOOK_SECRET`** in Vercel.

## 5. Alert engine

`npm run alert-engine` is a **long-running Node process**. Vercel does not run it. Host it elsewhere (Railway, Fly.io, ECS, a small VPS) with the same `DATABASE_URL` and optional `REDIS_URL`, or move that workload to a queue + cron later.

## 6. Where to see builds

After the repo is linked, each push to the connected branch creates a **Deployment** in the Vercel project. Open the project → **Deployments** to see status, logs, and the preview URL.
