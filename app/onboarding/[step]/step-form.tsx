"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Phone = { id: string; e164: string; enabled: boolean };

type Flags = {
  emailVerification: boolean;
  twilioVerify: boolean;
  lemonSqueezyCheckout: boolean;
  stripeCheckout: boolean;
};

export function OnboardingStepForm({
  step,
  emailVerified,
  awaitingLemonReturn,
}: {
  step: number;
  emailVerified: boolean;
  awaitingLemonReturn?: boolean;
}) {
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<Flags | null>(null);

  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState("");
  const [plan, setPlan] = useState<"MONTHLY" | "ANNUAL" | "ANNUAL_CRYPTO">(
    "MONTHLY",
  );

  async function refreshPhones() {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const data = await res.json();
    setPhones(data.user?.phoneNumbers ?? []);
  }

  useEffect(() => {
    void refreshPhones();
  }, [step]);

  useEffect(() => {
    void fetch("/api/public/flags")
      .then((r) => r.json())
      .then((f: Flags) => setFlags(f))
      .catch(() =>
        setFlags({
          emailVerification: false,
          twilioVerify: false,
          lemonSqueezyCheckout: false,
          stripeCheckout: false,
        }),
      );
  }, []);

  useEffect(() => {
    if (!awaitingLemonReturn) return;
    let cancelled = false;
    const id = window.setInterval(() => {
      void (async () => {
        const res = await fetch("/api/me");
        if (!res.ok || cancelled) return;
        const data = await res.json().catch(() => null);
        const os = data?.user?.subscription?.onboardingStep;
        if (typeof os === "number" && os >= 3) {
          router.push("/onboarding/4");
          router.refresh();
        }
      })();
    }, 1500);
    const stop = window.setTimeout(() => window.clearInterval(id), 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [awaitingLemonReturn, router]);

  async function verifyEmailDemo() {
    await fetch("/api/auth/verify-demo", { method: "POST" });
    router.refresh();
  }

  async function sendSmsCode() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e164 }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send code.");
      return;
    }
    if (data.mode === "demo") {
      setError(null);
    }
  }

  async function addPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e164, otp }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not verify number.");
      return;
    }
    setE164("");
    setOtp("");
    await refreshPhones();
  }

  async function continueFromPhone() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromStep: 1 }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Add at least one number.");
      return;
    }
    router.push("/onboarding/2");
    router.refresh();
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save plan.");
      return;
    }
    router.push("/onboarding/3");
    router.refresh();
  }

  async function runMockPayment() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/payment", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment failed.");
      return;
    }
    router.push("/onboarding/4");
    router.refresh();
  }

  async function startHostedCheckout() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/create-checkout", {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !data.url) {
      setError(
        data.error ??
          "Could not start checkout.",
      );
      return;
    }
    window.location.href = data.url as string;
  }

  async function complete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/onboarding/complete", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not activate.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (step === 1) {
    const twilioOn = flags?.twilioVerify;
    const resendOn = flags?.emailVerification;
    return (
      <div>
        <h1 className="text-xl font-semibold">Add a phone number</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          E.164 format (e.g. +14155552671).
          {twilioOn
            ? " Tap “Send SMS code” to receive a code from Twilio Verify."
            : " Demo mode accepts OTP 000000 without Twilio."}
        </p>
        {!emailVerified && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            {resendOn ? (
              <p>
                Verify your email using the link we sent. Until then, you cannot
                continue past this step while Resend is configured.
              </p>
            ) : (
              <>
                <p>
                  Email delivery is not configured; use the demo verifier for
                  local testing.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => void verifyEmailDemo()}
                >
                  Mark email verified (demo)
                </Button>
              </>
            )}
          </div>
        )}
        <form onSubmit={addPhone} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="e164">
              Phone (E.164)
            </label>
            <input
              id="e164"
              value={e164}
              onChange={(e) => setE164(e.target.value)}
              placeholder="+14155552671"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
            {twilioOn && (
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={loading || !e164}
                onClick={() => void sendSmsCode()}
              >
                Send SMS code
              </Button>
            )}
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="otp">
              Verification code
            </label>
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={twilioOn ? "6-digit code" : "000000"}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify & add"}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-sm font-medium">Your numbers</p>
          <ul className="mt-2 space-y-2">
            {phones.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                {p.e164}
              </li>
            ))}
            {phones.length === 0 && (
              <li className="text-sm text-[var(--muted)]">None yet.</li>
            )}
          </ul>
          <Button
            type="button"
            className="mt-6 w-full sm:w-auto"
            disabled={loading || phones.length < 1}
            onClick={() => void continueFromPhone()}
          >
            Continue to plan
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Choose your plan</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Estimated per-call rates for your region appear here in production.
        </p>
        <form onSubmit={savePlan} className="mt-8 space-y-4">
          <div className="space-y-3">
            {(
              [
                ["MONTHLY", "$10 / month"],
                ["ANNUAL", "$100 / year (2 months free)"],
                ["ANNUAL_CRYPTO", "$85 / year USDC (15% off)"],
              ] as const
            ).map(([id, label]) => (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                  plan === id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)]"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  checked={plan === id}
                  onChange={() => setPlan(id)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Continue to payment"}
          </Button>
        </form>
      </div>
    );
  }

  if (step === 3) {
    const lemonOn = flags?.lemonSqueezyCheckout;
    const stripeOn = flags?.stripeCheckout;
    const hostedOn = Boolean(lemonOn || stripeOn);
    return (
      <div>
        <h1 className="text-xl font-semibold">Payment</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {awaitingLemonReturn
            ? "Confirming your Lemon Squeezy payment… you’ll move to the next step automatically when the webhook arrives."
            : lemonOn
              ? "Pay with Lemon Squeezy (primary). USDC annual still uses the simulated path until Circle is wired."
              : stripeOn
                ? "Pay with Stripe Checkout (cards, Apple Pay, Google Pay where enabled). USDC annual still uses the simulated path until Circle is wired."
                : "Configure Lemon Squeezy or Stripe in the environment to enable hosted checkout; otherwise use the simulator below."}
        </p>
        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {hostedOn && (
            <Button
              type="button"
              disabled={loading || Boolean(awaitingLemonReturn)}
              onClick={() => void startHostedCheckout()}
            >
              {loading
                ? "Redirecting…"
                : lemonOn
                  ? "Pay with Lemon Squeezy"
                  : "Pay with Stripe Checkout"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void runMockPayment()}
          >
            Simulate successful checkout (dev)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Confirm & activate</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Your subscription will move to ACTIVE. Welcome email can go through
        Resend once you configure DNS.
      </p>
      <form onSubmit={complete} className="mt-8">
        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Activating…" : "Activate VolCall"}
        </Button>
      </form>
    </div>
  );
}
