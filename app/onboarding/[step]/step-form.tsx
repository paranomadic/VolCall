"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Phone = { id: string; e164: string; enabled: boolean };

export function OnboardingStepForm({
  step,
  emailVerified,
}: {
  step: number;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function verifyEmailDemo() {
    await fetch("/api/auth/verify-demo", { method: "POST" });
    router.refresh();
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

  async function mockPayment(e: React.FormEvent) {
    e.preventDefault();
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
    return (
      <div>
        <h1 className="text-xl font-semibold">Add a phone number</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          E.164 format (e.g. +14155552671). Demo OTP:{" "}
          <code className="text-[var(--accent)]">000000</code>
        </p>
        {!emailVerified && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p>Email not verified yet. In production you&apos;d click the link in
            your inbox.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => void verifyEmailDemo()}
            >
              Mark email verified (demo)
            </Button>
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
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="otp">
              Verification code
            </label>
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
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
    return (
      <div>
        <h1 className="text-xl font-semibold">Payment</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Production uses Stripe Checkout (card, Apple Pay, Google Pay) and
          Circle for USDC. This demo confirms instantly.
        </p>
        <form onSubmit={mockPayment} className="mt-8">
          {error && (
            <p className="mb-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Processing…" : "Simulate successful checkout"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Confirm & activate</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Your subscription will move to ACTIVE. A welcome email would be sent
        via Resend or SendGrid.
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
