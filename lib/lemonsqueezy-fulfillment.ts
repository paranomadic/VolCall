import { prisma } from "@/lib/prisma";

function userIdFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const custom = (meta as { custom_data?: Record<string, unknown> }).custom_data;
  if (!custom || typeof custom !== "object") return null;
  const uid = custom.user_id;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}

/** order_created — order must be paid */
export async function fulfillLemonOrderCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const userId = userIdFromMeta(meta);
  if (!userId) return;

  const data = payload.data as
    | { id?: string; attributes?: { status?: string } }
    | undefined;
  const status = data?.attributes?.status;
  if (status !== "paid") return;

  const orderId = data?.id != null ? String(data.id) : undefined;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      ...(sub.onboardingStep === 2 ? { onboardingStep: 3 } : {}),
      ...(orderId ? { lemonSqueezyOrderId: orderId } : {}),
      paymentMethodLabel: "Card (Lemon Squeezy)",
    },
  });
}

/** subscription_created — stores Lemon subscription id; may run before/after order */
export async function fulfillLemonSubscriptionCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const userId = userIdFromMeta(meta);
  if (!userId) return;

  const data = payload.data as { id?: string } | undefined;
  const lsSubId = data?.id != null ? String(data.id) : null;
  if (!lsSubId) return;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      lemonSqueezySubscriptionId: lsSubId,
      paymentMethodLabel: "Card (Lemon Squeezy)",
    },
  });
}
