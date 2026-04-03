import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user?.subscription) redirect("/login");
  const sub = user.subscription;
  if (sub.state === "ACTIVE" && sub.onboardingStep >= 4) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold">
            Vol<span className="text-[var(--accent)]">Call</span>
          </Link>
          <span className="text-sm text-[var(--muted)]">Onboarding</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
