"use client";

import { useEffect, useState } from "react";

type Me = {
  email: string;
  smsFallback: boolean;
  summaryEmailOptIn: boolean;
  phoneNumbers: {
    id: string;
    e164: string;
    enabled: boolean;
    dndStartMin: number | null;
    dndEndMin: number | null;
  }[];
  alertPrefs: { asset: string; enabled: boolean }[];
};

function minutesToTimeValue(m: number | null | undefined) {
  if (m == null) return "";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

function timeValueToMinutes(s: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      setMe(data.user);
    })();
  }, []);

  async function refresh() {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const data = await res.json();
    setMe(data.user);
  }

  async function patchPhone(
    id: string,
    body: Record<string, unknown>,
  ) {
    await fetch(`/api/phone/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  }

  async function toggleAlert(asset: string, enabled: boolean) {
    await fetch("/api/settings/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset, enabled }),
    });
    await refresh();
  }

  async function patchNotifications(body: Record<string, boolean>) {
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  }

  if (!me) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Account email/password changes and invoice PDFs would connect to your
          auth service and Stripe in production.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Notifications</h2>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={me.smsFallback}
            onChange={(e) =>
              void patchNotifications({ smsFallback: e.target.checked })
            }
          />
          SMS fallback if a voice call is not answered (Phase 1 scope TBD in PRD
          open questions)
        </label>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={me.summaryEmailOptIn}
            onChange={(e) =>
              void patchNotifications({ summaryEmailOptIn: e.target.checked })
            }
          />
          Monthly summary email on the 1st
        </label>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Per-number Do Not Disturb</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Local time, e.g. 23:00–07:00. Critical override requires explicit
          consent at onboarding.
        </p>
        <ul className="mt-6 space-y-6">
          {me.phoneNumbers.map((p) => (
            <li key={p.id} className="border-t border-[var(--border)] pt-6 first:border-0 first:pt-0">
              <p className="font-mono text-sm">{p.e164}</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="text-sm">
                  <span className="text-[var(--muted)]">Quiet from</span>
                  <input
                    type="time"
                    key={`${p.id}-start-${p.dndStartMin ?? "x"}`}
                    defaultValue={minutesToTimeValue(p.dndStartMin ?? undefined)}
                    className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1"
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        void patchPhone(p.id, {
                          dndStartMin: null,
                          dndEndMin: null,
                        });
                        return;
                      }
                      const mins = timeValueToMinutes(v);
                      if (mins == null) return;
                      void patchPhone(p.id, { dndStartMin: mins });
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-[var(--muted)]">to</span>
                  <input
                    type="time"
                    key={`${p.id}-end-${p.dndEndMin ?? "x"}`}
                    defaultValue={minutesToTimeValue(p.dndEndMin ?? undefined)}
                    className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1"
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        void patchPhone(p.id, {
                          dndStartMin: null,
                          dndEndMin: null,
                        });
                        return;
                      }
                      const mins = timeValueToMinutes(v);
                      if (mins == null) return;
                      void patchPhone(p.id, { dndEndMin: mins });
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) =>
                      void patchPhone(p.id, { enabled: e.target.checked })
                    }
                  />
                  Calls enabled
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Assets to monitor</h2>
        <ul className="mt-4 space-y-2">
          {me.alertPrefs.map((a) => (
            <li key={a.asset} className="flex items-center justify-between text-sm">
              <span>{a.asset}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) =>
                    void toggleAlert(a.asset, e.target.checked)
                  }
                />
                Enabled
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Data &amp; compliance</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          GDPR: delete account with 30-day cool-down; export JSON within 72
          hours — to be implemented against production APIs.
        </p>
      </section>
    </div>
  );
}
