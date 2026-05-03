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

type PaymentStatus = {
  lemonSqueezyConfigured: boolean;
  stripeConfigured: boolean;
};

type DvolRow = {
  asset: string;
  dvol: number | null;
  error?: string;
  band?: string;
  wouldAlert?: boolean;
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
  const [payments, setPayments] = useState<PaymentStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  const [grantEmail, setGrantEmail] = useState("");
  const [flowEmail, setFlowEmail] = useState("");
  const [callAsset, setCallAsset] = useState<"BTC" | "ETH">("BTC");
  const [dvolOverride, setDvolOverride] = useState("");
  const [dryRun, setDryRun] = useState(false);

  const [callMsg, setCallMsg] = useState<string | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [dvolMsg, setDvolMsg] = useState<string | null>(null);
  const [dvolRows, setDvolRows] = useState<DvolRow[] | null>(null);
  const [dvolLatency, setDvolLatency] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        setLoadError(res.status === 403 ? "Not allowed." : "Could not load settings.");
        return;
      }
      const data = await res.json();
      setSettings(data.settings as Settings);
      if (data.voice && typeof data.voice === "object") {
        setVoice(data.voice as VoiceStatus);
      }
      if (data.payments && typeof data.payments === "object") {
        setPayments(data.payments as PaymentStatus);
      }
    })();
  }, []);

  async function saveThresholds(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSettingsNotice(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSettingsNotice(data.error ? JSON.stringify(data.error) : "Save failed.");
      return;
    }
    setSettings(data.settings);
    setSettingsNotice("Thresholds saved.");
  }

  async function grantFree(e: React.FormEvent) {
    e.preventDefault();
    setSettingsNotice(null);
    const res = await fetch("/api/admin/grant-free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: grantEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSettingsNotice(data.error ?? "Grant failed.");
      return;
    }
    setSettingsNotice(`Granted comp access to ${data.email}.`);
    setGrantEmail("");
  }

  async function runCallTest(e: React.FormEvent) {
    e.preventDefault();
    setCallMsg(null);
    if (!flowEmail.trim()) {
      setCallMsg("Enter the subscriber email above.");
      return;
    }
    const body: Record<string, unknown> = {
      email: flowEmail.trim(),
      asset: callAsset,
      dryRun,
    };
    const o = dvolOverride.trim();
    if (o !== "") {
      const n = Number(o);
      if (!Number.isFinite(n)) {
        setCallMsg("DVOL override must be a number.");
        return;
      }
      body.dvolOverride = n;
    }
    const res = await fetch("/api/admin/trigger-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      setCallMsg(formatTriggerError(data, res.status));
      return;
    }
    setCallMsg(
      dryRun
        ? `Simulated: band=${String(data.band)}, wouldAlert=${String(data.wouldAlert)}. ${typeof data.message === "string" ? data.message : ""}`
        : `Call placed via ${String(data.channel)} (id=${String(data.id)}). Band=${String(data.band)}.`,
    );
  }

  async function runPaymentAction(
    action: "status" | "simulate_checkout" | "hosted_checkout",
  ) {
    setPaymentMsg(null);
    setPaymentLoading(action);
    if (!flowEmail.trim()) {
      setPaymentMsg("Enter the subscriber email above.");
      setPaymentLoading(null);
      return;
    }
    const res = await fetch("/api/admin/payment-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: flowEmail.trim(), action }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    setPaymentLoading(null);
    if (!res.ok) {
      setPaymentMsg(
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error ?? data),
      );
      return;
    }
    if (action === "hosted_checkout" && typeof data.url === "string") {
      setPaymentMsg(
        `Opened ${String(data.provider)} checkout in a new tab. Complete payment as that user.`,
      );
      window.open(data.url, "_blank", "noopener,noreferrer");
      return;
    }
    setPaymentMsg(JSON.stringify(data, null, 2));
  }

  async function runDvolRead() {
    setDvolMsg(null);
    setDvolRows(null);
    setDvolLatency(null);
    const res = await fetch("/api/admin/dvol-read", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as {
      readings?: DvolRow[];
      latencyMs?: number;
      error?: unknown;
    };
    if (!res.ok) {
      setDvolMsg(JSON.stringify(data));
      return;
    }
    setDvolRows(data.readings ?? null);
    setDvolLatency(typeof data.latencyMs === "number" ? data.latencyMs : null);
    setDvolMsg(`Deribit OK · ${String(data.latencyMs ?? "?")} ms`);
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
          <code className="text-xs">ADMIN_EMAILS</code> or{" "}
          <code className="text-xs">isAdmin</code> required. Use{" "}
          <strong>App flow tests</strong> below to validate calls, billing, and
          DVOL reads.
        </p>
      </div>

      {settingsNotice && (
        <p className="rounded-lg border border-[var(--border)] bg-white/5 px-4 py-3 text-sm">
          {settingsNotice}
        </p>
      )}

      <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
        <h2 className="text-lg font-semibold">App flow tests</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Call and payment flows use the same subscriber email (must exist in DB,
          verified phone for real calls).
        </p>
        <label className="mt-4 block text-sm font-medium">
          Subscriber email (call + payment tests)
          <input
            type="email"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            placeholder="you@example.com"
            value={flowEmail}
            onChange={(e) => setFlowEmail(e.target.value)}
          />
        </label>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-medium">1. Call test</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Vapi/Twilio outbound (or simulate DB row only).
            </p>
            {voice &&
              !voice.vapiConfigured &&
              !voice.twilioVoiceConfigured && (
                <p className="mt-2 text-xs text-amber-200/90">
                  No voice env — use Simulate only or add Vapi/Twilio on server.
                </p>
              )}
            <form onSubmit={runCallTest} className="mt-4 space-y-3">
              <label className="block text-xs">
                Asset
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={callAsset}
                  onChange={(e) =>
                    setCallAsset(e.target.value as "BTC" | "ETH")
                  }
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </label>
              <label className="block text-xs">
                DVOL override (optional)
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="e.g. 95"
                  value={dvolOverride}
                  onChange={(e) => setDvolOverride(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                />
                Simulate only (no dial)
              </label>
              <Button type="submit" className="w-full sm:w-auto">
                {dryRun ? "Run call simulation" : "Place test call"}
              </Button>
            </form>
            {callMsg && (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-[var(--border)] bg-black/20 p-2 text-xs">
                {callMsg}
              </pre>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-medium">2. Payment test</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Inspect status, mock paid step, or open Lemon/Stripe checkout.
            </p>
            {payments && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Hosted:{" "}
                {payments.lemonSqueezyConfigured
                  ? "Lemon Squeezy (primary)"
                  : payments.stripeConfigured
                    ? "Stripe"
                    : "none (use simulate)"}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={paymentLoading != null}
                onClick={() => void runPaymentAction("status")}
              >
                {paymentLoading === "status" ? "…" : "Check payment status"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={paymentLoading != null}
                onClick={() => void runPaymentAction("simulate_checkout")}
              >
                {paymentLoading === "simulate_checkout"
                  ? "…"
                  : "Simulate checkout (step → 3)"}
              </Button>
              <Button
                type="button"
                disabled={paymentLoading != null}
                onClick={() => void runPaymentAction("hosted_checkout")}
              >
                {paymentLoading === "hosted_checkout"
                  ? "…"
                  : "Open hosted checkout"}
              </Button>
            </div>
            {paymentMsg && (
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-[var(--border)] bg-black/20 p-2 text-xs">
                {paymentMsg}
              </pre>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-medium">3. DVOL read test</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Live Deribit index (same as alert worker source).
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() => void runDvolRead()}
            >
              Run DVOL read
            </Button>
            {dvolLatency != null && (
              <p className="mt-2 text-xs text-[var(--muted)]">{dvolMsg}</p>
            )}
            {dvolRows && (
              <ul className="mt-3 space-y-2 text-sm">
                {dvolRows.map((r) => (
                  <li
                    key={r.asset}
                    className="rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <span className="font-medium">{r.asset}</span>
                    {r.error && (
                      <span className="ml-2 text-red-400">{r.error}</span>
                    )}
                    {r.dvol != null && (
                      <span className="text-[var(--muted)]">
                        {" "}
                        DVOL {r.dvol.toFixed(2)} · band {r.band} · alert{" "}
                        {r.wouldAlert ? "yes" : "no"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {dvolMsg && !dvolRows && (
              <p className="mt-2 text-xs text-red-400">{dvolMsg}</p>
            )}
          </div>
        </div>
      </section>

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
    </div>
  );
}
