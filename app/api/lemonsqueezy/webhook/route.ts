import { NextResponse } from "next/server";
import {
  fulfillLemonOrderCreated,
  fulfillLemonSubscriptionCreated,
} from "@/lib/lemonsqueezy-fulfillment";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Lemon Squeezy webhook not configured" },
      { status: 503 },
    );
  }

  const raw = await request.text();
  const sig = request.headers.get("X-Signature");
  if (!verifyLemonSqueezySignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headerEvent = request.headers.get("X-Event-Name");
  const metaEvent = (payload.meta as { event_name?: string } | undefined)
    ?.event_name;
  const event = headerEvent ?? metaEvent;

  if (event === "order_created") {
    await fulfillLemonOrderCreated(payload);
  } else if (event === "subscription_created") {
    await fulfillLemonSubscriptionCreated(payload);
  }

  return NextResponse.json({ received: true });
}
