"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tcpa, setTcpa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tcpaConsent: tcpa }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "Check fields and try again.",
      );
      return;
    }
    router.push("/onboarding/1");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-center text-lg font-semibold">
        Vol<span className="text-[var(--accent)]">Call</span>
      </Link>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Password: min 8 characters, one uppercase letter, one number.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label
            className="block text-sm text-[var(--muted)]"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={tcpa}
            onChange={(e) => setTcpa(e.target.checked)}
            className="mt-1"
          />
          <span>
            I consent to receive automated calls from VolCall at the numbers I
            verify, including marketing and alert calls where permitted. I can
            opt out anytime (including by pressing 9 on a call).{" "}
            <span className="text-[var(--accent)]">Required</span>
          </span>
        </label>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !tcpa}
        >
          {loading ? "Creating…" : "Continue"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
