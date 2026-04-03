"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = {
  email: string;
  emailVerified: boolean;
  subscription: {
    state: string;
    plan: string;
    renewalAt: string | null;
    paymentMethodLabel: string | null;
  };
  phoneNumbers: {
    id: string;
    e164: string;
    enabled: boolean;
  }[];
  callEvents: {
    id: string;
    occurredAt: string;
    asset: string;
    trigger: string;
    durationSec: number | null;
    answered: boolean;
  }[];
  alertPrefs: { asset: string; enabled: boolean }[];
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setError("Could not load account.");
        return;
      }
      const data = await res.json();
      setMe(data.user);
    })();
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }
  if (!me) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-xl bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
      </div>
    );
  }

  const answered = me.callEvents.filter((c) => c.answered).length;
  const total = me.callEvents.length;
  const rate = total ? Math.round((answered / total) * 100) : 0;

  const planLabel: Record<string, string> = {
    MONTHLY: "Monthly ($10/mo)",
    ANNUAL: "Annual ($100/yr)",
    ANNUAL_CRYPTO: "Annual USDC ($85/yr)",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Subscriber dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live DVOL feed and Twilio dispatch run in production workers — this UI
          is wired to your account state.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-medium">Subscription</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Status</dt>
              <dd>{me.subscription.state}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Plan</dt>
              <dd>{planLabel[me.subscription.plan] ?? me.subscription.plan}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Renewal</dt>
              <dd>
                {me.subscription.renewalAt
                  ? new Date(me.subscription.renewalAt).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Payment</dt>
              <dd>{me.subscription.paymentMethodLabel ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Manage or cancel in production via Stripe Customer Portal.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-medium">Monthly summary</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Automated email on the 1st (Resend/SendGrid) with optional volatility
            chart.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Calls (sample)</dt>
              <dd>{total}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Answer rate</dt>
              <dd>{total ? `${rate}%` : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Phone numbers</h2>
          <Link
            href="/settings"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            DND &amp; SMS in settings
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {me.phoneNumbers.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span>{p.e164}</span>
              <span
                className={
                  p.enabled ? "text-[var(--accent)]" : "text-[var(--muted)]"
                }
              >
                {p.enabled ? "Enabled" : "Disabled"}
              </span>
            </li>
          ))}
          {me.phoneNumbers.length === 0 && (
            <li className="py-3 text-[var(--muted)]">No numbers on file.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Alert settings</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Default thresholds from the PRD (DVOL / realised vol). Custom thresholds
          ship in Phase 1.1.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {me.alertPrefs.map((a) => (
            <li
              key={a.asset}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span>{a.asset}</span>
              <span
                className={
                  a.enabled ? "text-[var(--accent)]" : "text-[var(--muted)]"
                }
              >
                {a.enabled ? "On" : "Off"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="border-b border-[var(--border)] bg-white/5 px-6 py-4">
          <h2 className="font-medium">Call history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium">Trigger</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {me.callEvents.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {new Date(c.occurredAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">{c.asset}</td>
                  <td className="px-6 py-3">{c.trigger}</td>
                  <td className="px-6 py-3">
                    {c.durationSec != null ? `${c.durationSec}s` : "—"}
                  </td>
                  <td className="px-6 py-3">
                    {c.answered ? "Answered" : "Missed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {me.callEvents.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-[var(--muted)]">
              No calls yet. When DVOL crosses thresholds, events appear here from
              Twilio webhooks.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
