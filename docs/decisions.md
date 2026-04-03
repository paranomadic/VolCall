# VolCall — product decisions & repo map

This document records **implementation choices** relative to **VOLCALL PRD v1.0** and maps them to **what exists in this repository today**. Use it for onboarding engineers and for planning the next integration milestones.

---

## Decision table

| Topic | Decision | In the repo today | Next steps (when prioritized) |
|-------|----------|-------------------|-------------------------------|
| **Backend shape** | PRD suggests Next.js (frontend) and Node + Fastify (APIs). This repo uses **Next.js App Router + Route Handlers only** so there is a single app to run and deploy; Fastify can be split out later with limited UI impact. | `app/api/**` route handlers; one Next.js deployable. | Optional: extract high-throughput or long-running paths to Fastify (or a worker) behind the same domain. |
| **Auth tokens** | PRD: 15-minute access + 7-day refresh. **MVP:** single **httpOnly JWT cookie** (7-day TTL) to avoid refresh plumbing in the browser. | `lib/session.ts`, `middleware.ts`. | Production hardening: short-lived access token + refresh rotation, or adopt a session store (Redis). |
| **OAuth (Google/GitHub)** | PRD **Phase 1.1** — deferred. | Email/password only: `app/signup`, `app/login`, `app/api/auth/*`. | Add OAuth providers (e.g. Auth.js) when Phase 1.1 is scheduled. |
| **Email verification** | PRD requires verification before full activation. **Real delivery not wired** in MVP; model supports `emailVerified`. | Demo: `POST /api/auth/verify-demo`, onboarding “Mark email verified” UI. | **Wire transactional email** (PRD names **Resend** or **SendGrid**): verification link, signed token table or one-time codes, production `AUTH_BASE_URL`. |
| **Twilio** | **Simulated:** E.164 + OTP **`000000`**; no Verify or Voice. | `app/api/onboarding/phone`, onboarding UI. | Twilio account → **Account SID**, **Auth Token** (or API key), **Verify Service** for OTP; **Programmable Voice** number + TwiML URL + status callbacks for production calls. Env-only config; never commit secrets. Alternatives exist for SMS-only (e.g. other CPaaS), but **voice** path in the PRD maps most directly to Twilio. |
| **Stripe / Circle** | **Simulated:** plan in DB; mock checkout; no webhooks or metered usage. | `app/api/onboarding/plan`, `payment`, `complete`. | Stripe: Checkout/Customer Portal, webhooks (`invoice.payment_succeeded`, etc.), metered usage for per-call pass-through. Circle: on-chain confirmation flow and dashboard “pending” states. |
| **Deribit DVOL / alert engine** | **Not running.** PRD: workers, Redis cooldowns, optional queue (SQS/BullMQ). | Dashboard copy only; no feed client, no dispatch loop. | **Separate service** (Node worker or `packages/*`): Deribit WebSocket/REST, threshold evaluation, Redis SETNX/cooldown, enqueue to Twilio; notify engineering on feed failure. |
| **Database** | **SQLite + Prisma** locally; PRD production: **PostgreSQL + Redis**. | `prisma/schema.prisma`, `DATABASE_URL` file-backed SQLite. | Migrate to Postgres; add ElastiCache/Redis for sessions, cooldowns, and locks. |
| **Custom thresholds** | PRD open question — **fixed defaults at launch**; no per-asset custom thresholds in UI (only enable/disable). | Alert prefs toggles; thresholds described in copy / PRD alignment. | Phase 1.1: admin + subscriber threshold overrides stored per asset. |
| **SMS fallback** | PRD open question — **toggle only**; no SMS send. | `User.smsFallback`, settings UI, `app/api/settings/notifications`. | Implement after choosing provider; respect opt-in and regional rules. |
| **Admin panel** | PRD: configurable assets/thresholds — **not built** in this pass. | — | Admin auth, CRUD for assets/default thresholds, audit log. |
| **Monthly summary email / invoices / GDPR delete** | **Placeholders** only in UI/copy. | — | Resend/SendGrid template + monthly job; Stripe Portal links; account deletion cool-down + export job per PRD. |
| **TCPA** | Required **consent checkbox** on signup; opt-out language in marketing/onboarding copy. | `app/signup`, landing page. | Legal review of exact copy; voice script “press 9 to opt out” in TwiML at call time. |

---

## What lives where (quick map)

| Area | Paths |
|------|--------|
| Marketing landing | `app/page.tsx`, `components/marketing-nav.tsx` |
| Auth | `app/signup`, `app/login`, `app/api/auth/*`, `lib/password.ts`, `lib/session.ts` |
| Onboarding | `app/onboarding/**`, `app/api/onboarding/*` |
| Subscriber shell | `components/subscriber-layout.tsx`, `components/app-shell.tsx` |
| Dashboard | `app/dashboard` |
| Settings | `app/settings`, `app/api/settings/*`, `app/api/phone/[id]` |
| Data model | `prisma/schema.prisma`, `lib/prisma.ts` |
| Route protection | `middleware.ts` |

---

## Definition: “what this repo is” right now

A **Phase-1-shaped product shell**: real account lifecycle, onboarding, subscription state in the database, and subscriber UI — with **external integrations stubbed** where the table above indicates. Production alerting, payments, email, and compliance automation are **follow-on work** tracked in this document.

---

*Last aligned with product review comments: April 2026.*
