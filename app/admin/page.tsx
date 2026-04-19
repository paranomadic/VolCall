"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Settings = {
  btcElevated: number;
  btcHigh: number;
  btcCritical: number;
  ethElevated: number;
  ethHigh: number;
  ethCritical: number;
};

type VoiceStatus = {
  vapiConfigured: boolean;
  twilioVoiceConfigured: boolean;
};

function formatTriggerError(data: Record<string, unknown>, status: number) {
  const err = data.error;
  const hint = data.hint;
  const parts: string[] = [];
  if (typeof err === "string") parts.push(err);
  else if (err != null) parts.push(JSON.stringify(err));
  if (typeof hint === "string") parts.push(hint);
  return parts.join(" — ") || `Request failed (HTTP ${status})`;
}

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [voice, setVoice] = useState<VoiceStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [grantEmail, setGrantEmail] = useState("");
  const [callEmail, setCallEmail] = useState("");
  const [callAsset, setCallAsset] = useState<"BTC" | "ETH">("BTC");
  const [dvolOverride, setDvolOverride] = useState("");
  /** When true, only writes CallEvent — no Vapi/Twilio. Default off so “Place call” dials. */
  const [dryRun, setDryRun] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        setLoadError(res.status === 403 ? "Not allowed." : "Could not load settings.");
        return;
      }
      const data = await res.json();
      const s = data.settings as Settings;
      setSettings(s);
      if (data.voice && typeof data.voice === "object") {
        setVoice(data.voice as VoiceStatus);
      }
    })();
  }, []);

  async function saveThresholds(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ? JSON.stringify(data.error) : "Save failed.");
      return;
    }
    setSettings(data.settings);
    setMsg("Thresholds saved.");
  }

  async function grantFree(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/grant-free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: grantEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Grant failed.");
      return;
    }
    setMsg(`Granted comp access to ${data.email}.`);
    setGrantEmail("");
  }

  async function triggerCall(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const body: Record<string, unknown> = {
      email: callEmail,
      asset: callAsset,
      dryRun,
    };
    const o = dvolOverride.trim();
    if (o !== "") {
      const n = Number(o);
      if (!Number.isFinite(n)) {
        setMsg("DVOL override must be a number.");
        return;
      }
      body.dvolOverride = n;
    }
    const res = await fetch("/api/admin/trigger-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      setMsg(formatTriggerError(data, res.status));
      return;
    }
    setMsg(
      dryRun
        ? `Dry run: band=${String(data.band)}, wouldAlert=${String(data.wouldAlert)}. ${typeof data.message === "string" ? data.message : ""}`
        : `Call placed via ${String(data.channel)} (id=${String(data.id)}). Band=${String(data.band)}.`,
    );
  }

  if (loadError) {
    return <p className="text-red-400">{loadError}</p>;
  }
  if (!settings) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Access is limited to <code className="text-xs">ADMIN_EMAILS</code> or
          users with <code className="text-xs">isAdmin</code> in the database.
        </p>
      </div>

      {msg && (
        <p className="rounded-lg border border-[var(--border)] bg-white/5 px-4 py-3 text-sm">
          {msg}
        </p>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">DVOL band thresholds (alert engine)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Rules: <code className="text-xs">&gt; critical</code>, then{" "}
          <code className="text-xs">&gt; high</code>, then{" "}
          <code className="text-xs">&gt;= elevated</code>. Voice alerts fire on
          high + critical only.
        </p>
        <form onSubmit={saveThresholds} className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)]">BTC</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="text-[var(--muted)]">Elevated ≥</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.btcElevated}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      btcElevated: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">High &gt;</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.btcHigh}
                  onChange={(e) =>
                    setSettings({ ...settings, btcHigh: Number(e.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">Critical &gt;</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.btcCritical}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      btcCritical: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)]">ETH</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="text-[var(--muted)]">Elevated ≥</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.ethElevated}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ethElevated: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">High &gt;</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.ethHigh}
                  onChange={(e) =>
                    setSettings({ ...settings, ethHigh: Number(e.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">Critical &gt;</span>
                <input
                  type="number"
                  step="any"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={settings.ethCritical}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ethCritical: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          </div>
          <Button type="submit">Save thresholds</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Grant comp (skip payment)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sets subscription to ACTIVE, onboarding complete, payment label{" "}
          <code className="text-xs">Comp (admin)</code>, and enables default alert
          prefs.
        </p>
        <form onSubmit={grantFree} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="subscriber@example.com"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
          />
          <Button type="submit">Grant access</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Trigger test call</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Uses the subscriber&apos;s first <strong>verified</strong> phone. Set a
          DVOL override if Deribit is unreachable. For a real ring, leave
          &quot;Simulate only&quot; unchecked and configure voice env on the
          server (see below).
        </p>
        {voice &&
          !voice.vapiConfigured &&
          !voice.twilioVoiceConfigured && (
            <p
              className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
              role="alert"
            >
              <strong>No voice provider in this deployment.</strong> Add{" "}
              <code className="text-xs">VAPI_API_KEY</code>,{" "}
              <code className="text-xs">VAPI_ASSISTANT_ID</code>,{" "}
              <code className="text-xs">VAPI_PHONE_NUMBER_ID</code> and/or{" "}
              <code className="text-xs">TWILIO_ACCOUNT_SID</code>,{" "}
              <code className="text-xs">TWILIO_AUTH_TOKEN</code>,{" "}
              <code className="text-xs">TWILIO_FROM_NUMBER</code> in Vercel, then
              redeploy. Otherwise only &quot;Simulate only&quot; will succeed.
            </p>
          )}
        {voice && (voice.vapiConfigured || voice.twilioVoiceConfigured) && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Voice: {voice.vapiConfigured ? "Vapi ✓" : "Vapi —"} ·{" "}
            {voice.twilioVoiceConfigured ? "Twilio ✓" : "Twilio —"}
          </p>
        )}
        <form onSubmit={triggerCall} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                value={callEmail}
                onChange={(e) => setCallEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Asset</span>
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                value={callAsset}
                onChange={(e) =>
                  setCallAsset(e.target.value as "BTC" | "ETH")
                }
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">DVOL override (optional)</span>
            <input
              type="text"
              placeholder="e.g. 95 — forces band for message content"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
              value={dvolOverride}
              onChange={(e) => setDvolOverride(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Simulate only (record CallEvent in DB, no real phone call)
          </label>
          <Button type="submit">
            {dryRun ? "Simulate trigger" : "Place call"}
          </Button>
        </form>
      </section>
    </div>
  );
}
