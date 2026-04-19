import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingStepForm } from "./step-form";

export default async function OnboardingStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams?: Promise<{ ls?: string }>;
}) {
  const { step: raw } = await params;
  const sp = (await searchParams) ?? {};
  const awaitingLemonReturn = sp.ls === "return";
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 4) redirect("/onboarding/1");

  const user = await getCurrentUser();
  if (!user?.subscription) redirect("/login");
  const sub = user.subscription;
  if (sub.state === "ACTIVE" && sub.onboardingStep >= 4) {
    redirect("/dashboard");
  }

  const expected = Math.min(sub.onboardingStep + 1, 4);
  if (n !== expected) {
    redirect(`/onboarding/${expected}`);
  }

  return (
    <div>
      <ol className="mb-8 flex gap-2 text-xs text-[var(--muted)]">
        {[1, 2, 3, 4].map((s) => (
          <li
            key={s}
            className={`flex-1 rounded-full py-1 text-center ${
              s === n
                ? "bg-[var(--accent)] text-[#04120e] font-medium"
                : s < n
                  ? "bg-white/10"
                  : "bg-white/5"
            }`}
          >
            {s}
          </li>
        ))}
      </ol>
      <OnboardingStepForm
        step={n}
        emailVerified={user.emailVerified}
        awaitingLemonReturn={n === 3 && awaitingLemonReturn}
      />
    </div>
  );
}
