# VolCall — product decisions & repo map

This document records **implementation choices** relative to **VOLCALL PRD v1.0** and maps them to **what exists in this repository**. Use it for onboarding engineers and for planning the next integration milestones.

---

## Decision table

| Topic | Decision | In the repo today | Next steps (when prioritized) |
|-------|----------|-------------------|-------------------------------|
| **Backend shape** | PRD suggests Next.js (frontend) and Node + Fastify (APIs). This repo uses **Next.js App Router + Route Handlers only** so there is a single app to run and deploy; Fastify can be split out later with limited UI impact. | `app/api/**` route handlers; one Next.js deployable. **Long-running alert loop** is `workers/alert-engine.ts` (separate process). | Optional: extract high-throughput paths to Fastify behind the same domain. |
| **Auth tokens** | PRD: 15-minute access + 7-day refresh. **MVP:** single **httpOnly JWT cookie** (7-day TTL) to avoid refresh plumbing in the browser. | `lib/session.ts`, `middleware.ts`. | Production hardening: short-lived access token + refresh rotation, or adopt a session store (Redis). |
| **OAuth (Google/GitHub)** | PRD **Phase 1.1** — deferred. | Email/password only: `app/signup`, `app/login`, `app/api/auth/*`. | Add OAuth providers (e.g. Auth.js) when Phase 1.1 is scheduled. |
| **Email verification** | PRD requires verification before activation. | **Resend wired when `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set:** signup creates `EmailVerificationToken`, sends link to `GET /api/auth/verify-email?token=…` (redirects to `/login?verify=ok`). If Resend is configured, **phone onboarding enforces** `emailVerified` (see `lib/email-enforcement.ts`). | Production DNS + domain verification in Resend; token TTL and rate limits. |
| **Twilio / Vapi** | Programmable Voice in PRD; Verify for OTP. | **Verify wired when** `TWILIO_*` Verify vars are set; else OTP **`000000`**. **Voice alerts:** **`VAPI_API_KEY` + `VAPI_ASSISTANT_ID` + `VAPI_PHONE_NUMBER_ID`** → outbound calls via **`POST https://api.vapi.ai/call`** (primary). If Vapi fails or is unset, worker falls back to **Twilio** `TWILIO_FROM_NUMBER` when **`ALERT_ENGINE_DRY_RUN=false`**. | Tune IVR in Vapi; optional `VAPI_USE_VARIABLE_VALUES=true` if the assistant defines `asset` / `dvol` / `band`. |
| **Lemon Squeezy / Stripe / Circle** | Subscriptions in PRD. | **Lemon Squeezy (primary)** when `LEMONSQUEEZY_API_KEY`, store, variant IDs, and webhook secret are set: `POST /api/onboarding/create-checkout` creates a Lemon checkout; **`POST /api/lemonsqueezy/webhook`** handles `order_created` / `subscription_created`; stores `lemonSqueezyOrderId` / `lemonSqueezySubscriptionId`. **Stripe** is used only when Lemon is **not** fully configured (same checkout route). **`GET /api/stripe/checkout-return`** unchanged. **USDC / Circle** still simulated on step 3. | Lemon customer portal; Stripe portal if using Stripe fallback; Circle later. |
| **Deribit DVOL / alert engine** | Workers, threshold evaluation, cooldowns. | **`npm run alert-engine`** — polls Deribit for **BTC & ETH**, writes `FeedReading`, reads band cutoffs from **`SystemSettings`** (singleton row `id=1`; editable in **`/admin`**), applies **Redis** cooldown when `REDIS_URL` is set (else 24h window on `CallEvent`). **Default `ALERT_ENGINE_DRY_RUN=true`:** logs + `[dry-run]` rows instead of voice. | WebSocket feed, bundled multi-asset calls, SQS/BullMQ. |
| **Admin / testing** | Not in PRD — operator tools. | **`ADMIN_EMAILS`** (comma-separated) or **`User.isAdmin`** grants **`/admin`**: edit DVOL thresholds, **grant comp** (ACTIVE + onboarding 4 without payment), **trigger test call** (dry-run or Vapi/Twilio). APIs under `app/api/admin/*`. | Audit log; role-based admin; per-tenant thresholds. |
| **Database** | **PostgreSQL + Prisma** (required for Vercel); **Redis** optional for cooldowns. | `prisma/schema.prisma` uses `provider = "postgresql"` and `env("neon_storage_POSTGRES_URL")` (Vercel Neon Storage). | Use Prisma Migrate in production; Redis for multi-instance cooldowns. |
| **Custom thresholds** | PRD open question — **fixed defaults at launch**; no per-asset custom thresholds in UI (only enable/disable). | `lib/thresholds.ts` + alert toggles in dashboard/settings. | Phase 1.1: admin + subscriber threshold overrides. |
| **SMS fallback** | PRD open question — toggle only. | `User.smsFallback`, settings UI, `app/api/settings/notifications`. | Implement SMS send path after policy review. |
| **Admin panel** | PRD: configurable assets/thresholds — **not built** in this pass. | — | Admin auth, CRUD, audit log. |
| **Monthly summary email / invoices / GDPR delete** | Placeholders in UI/copy. | — | Resend cron template; Stripe Portal links; GDPR jobs. |
| **TCPA** | Consent at signup + opt-out in copy / TwiML. | `app/signup`, landing, worker `Say` includes opt-out wording stub. | Legal review of exact language. |

---

## What lives where (quick map)

| Area | Paths |
|------|--------|
| Marketing landing | `app/page.tsx`, `components/marketing-nav.tsx` |
| Auth | `app/signup`, `app/login`, `app/api/auth/*`, `lib/password.ts`, `lib/session.ts`, `app/api/auth/verify-email/route.ts` |
| Integration flags (client) | `GET /api/public/flags` |
| Onboarding | `app/onboarding/**`, `app/api/onboarding/*`, `app/api/lemonsqueezy/webhook`, `app/api/stripe/checkout-return`, `app/api/stripe/webhook` |
| Subscriber shell | `components/subscriber-layout.tsx`, `components/app-shell.tsx` |
| Dashboard | `app/dashboard` |
| Admin | `app/admin`, `app/api/admin/*` |
| Settings | `app/settings`, `app/api/settings/*`, `app/api/phone/[id]` |
| Data model | `prisma/schema.prisma`, `lib/prisma.ts` |
| Alert worker | `workers/alert-engine.ts`, `npm run alert-engine` |
| Route protection | `middleware.ts` |

---

## Definition: “what this repo is” right now

A **Phase-1-shaped product**: web app plus **optional production integrations** (Resend, Twilio Verify, **Lemon Squeezy** or **Stripe** checkout, **Vapi** or **Twilio** voice for alerts, Deribit polling worker, Redis cooldowns) controlled entirely by **environment variables**. Circle, metering, admin, and compliance automation remain **future work**.

---

*Last updated: April 2026 (integrations pass).*
