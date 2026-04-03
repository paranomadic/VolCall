import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,166,0.12),transparent)]">
      <MarketingNav />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          Crypto markets · Phase 1
        </p>
        <h1 className="mx-auto max-w-4xl text-center text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Never Miss a Market-Moving Event
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-[var(--muted)]">
          VolCall rings your phone when implied volatility surges — so silent
          notifications never cost you another trade.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[#04120e] hover:brightness-110"
          >
            Start alerts
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-base font-medium text-[var(--foreground)] hover:bg-white/5"
          >
            See how it works
          </a>
        </div>
        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            ["99%+", "Alert delivery target"],
            ["\u003c 10%", "False positive target"],
            ["DVOL", "Deribit feed"],
            ["TCPA", "Opt-out on every call"],
          ].map(([k, v]) => (
            <div key={v} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <dt className="text-2xl font-semibold text-[var(--accent)]">{k}</dt>
              <dd className="mt-1 text-xs text-[var(--muted)]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">
            Silent alerts get buried. A ringing phone does not.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
              <h3 className="font-medium text-red-300">The problem</h3>
              <p className="mt-3 text-[var(--muted)]">
                Push and email are easy to mute. Major moves happen while you
                are away from charts — and by the time you notice, the move is
                gone.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-8">
              <h3 className="font-medium text-[var(--accent)]">The solution</h3>
              <p className="mt-3 text-[var(--muted)]">
                VolCall uses Twilio voice with a short, spoken summary when DVOL
                or realised vol crosses thresholds you care about. You pick up,
                you act — or you press 9 to opt out (TCPA).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          How it works
        </h2>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
          {[
            ["1", "Sign up", "Create your account and verify your email."],
            ["2", "Add number", "Up to five lines, OTP verified via Twilio."],
            ["3", "Get called", "We bundle multi-asset breaches into one call."],
          ].map(([n, t, d]) => (
            <li
              key={t}
              className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center"
            >
              <span className="text-3xl font-bold text-[var(--accent)]">{n}</span>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="border-y border-[var(--border)] bg-[var(--card)]/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">
            Transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--muted)]">
            $10/month platform access. Per-minute Twilio voice is passed through
            at exact cost — zero markup — on your monthly invoice.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] p-8">
              <p className="text-sm text-[var(--muted)]">Monthly</p>
              <p className="mt-2 text-4xl font-semibold">$10</p>
              <p className="mt-1 text-sm text-[var(--muted)]">per month</p>
            </div>
            <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-8">
              <p className="text-sm text-[var(--muted)]">Annual</p>
              <p className="mt-2 text-4xl font-semibold">$100</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                two months free vs monthly
              </p>
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Approx. per-minute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ["United States", "~$0.014"],
                  ["United Kingdom", "~$0.020"],
                  ["India", "~$0.019"],
                  ["Other", "Twilio rate card"],
                ].map(([a, b]) => (
                  <tr key={a as string}>
                    <td className="px-4 py-3">{a}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Annual USDC via Circle: $85/yr (15% discount). Typical calls under
            $0.03 in the US.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">FAQ</h2>
        <dl className="mt-10 space-y-6">
          {[
            [
              "Which assets are covered at launch?",
              "BTC, ETH, BNB, SOL, XRP, DOGE — expandable via admin. Phase 2 adds equities, commodities, and regional indices.",
            ],
            [
              "How often can you call me?",
              "At most one call per number per asset per 24 hours. Bundled calls when several assets breach together. Critical DVOL levels can bypass the cap once per event (with weekly safeguards).",
            ],
            [
              "Do Not Disturb?",
              "Per-number quiet hours in settings. Critical override only with explicit consent captured at onboarding.",
            ],
            [
              "Can I cancel?",
              "Yes — self-serve in Stripe Customer Portal. Service runs until the end of the paid period; no partial refunds (disclosed at checkout).",
            ],
          ].map(([q, a]) => (
            <div key={q as string} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <dt className="font-medium">{q}</dt>
              <dd className="mt-2 text-sm text-[var(--muted)]">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-[var(--border)] py-10 text-center text-sm text-[var(--muted)]">
        <p>VolCall PRD v1.0 · Demo web app · Not financial advice.</p>
      </footer>
    </div>
  );
}
