import { redirect } from "next/navigation";
import { fulfillCheckoutSessionById } from "@/lib/stripe-fulfillment";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    redirect("/onboarding/3?checkout=missing");
  }

  const ok = await fulfillCheckoutSessionById(sessionId);
  if (!ok) {
    redirect("/onboarding/3?checkout=failed");
  }

  redirect("/onboarding/4");
}
