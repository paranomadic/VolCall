import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_85%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Vol<span className="text-[var(--accent)]">Call</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <a href="#how" className="hover:text-[var(--foreground)]">
            How it works
          </a>
          <a href="#pricing" className="hover:text-[var(--foreground)]">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[var(--foreground)]">
            FAQ
          </a>
          <Link
            href="/admin"
            className="hover:text-[var(--foreground)]"
            title="Admin console (login required)"
          >
            Admin
          </Link>
          <Link
            href="/login"
            className="hover:text-[var(--foreground)]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[#04120e] font-medium hover:brightness-110"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
