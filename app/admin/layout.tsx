import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!isAdminUser(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            Vol<span className="text-[var(--accent)]">Call</span>
          </Link>
          <span className="text-sm text-[var(--muted)]">Admin</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
