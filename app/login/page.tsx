"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const verify = searchParams.get("verify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string" ? data.error : "Invalid credentials.",
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {verify === "ok" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Email verified. You can sign in.
        </p>
      )}
      {verify === "invalid" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Verification link is invalid or expired.
        </p>
      )}
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-center text-lg font-semibold">
        Vol<span className="text-[var(--accent)]">Call</span>
      </Link>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-lg bg-white/5" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        New here?{" "}
        <Link href="/signup" className="text-[var(--accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
