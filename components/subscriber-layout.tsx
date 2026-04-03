import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function SubscriberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user?.subscription) redirect("/login");
  const sub = user.subscription;
  if (!(sub.state === "ACTIVE" && sub.onboardingStep >= 4)) {
    const step = Math.min(sub.onboardingStep + 1, 4);
    redirect(`/onboarding/${step}`);
  }
  return <AppShell email={user.email}>{children}</AppShell>;
}
