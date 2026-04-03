import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSessionFromCookies();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    include: { subscription: true },
  });
}

export type UserWithSubscription = Prisma.UserGetPayload<{
  include: { subscription: true };
}>;

/** Next wizard step (1–4), or 5 if onboarding is complete. */
export function getOnboardingRequiredStep(
  onboardingStep: number | null | undefined,
): number {
  if (onboardingStep == null) return 1;
  if (onboardingStep >= 4) return 5;
  return onboardingStep + 1;
}
