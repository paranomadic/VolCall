import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            Vol<span className="text-[var(--accent)]">Call</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span className="hidden sm:inline truncate max-w-[200px]">{email}</span>
            <Link href="/dashboard" className="hover:text-[var(--foreground)]">
              Dashboard
            </Link>
            <Link href="/settings" className="hover:text-[var(--foreground)]">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
