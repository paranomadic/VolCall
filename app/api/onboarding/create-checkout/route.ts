import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { createHostedCheckoutForUserId } from "@/lib/hosted-checkout";

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createHostedCheckoutForUserId(session.sub);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    url: result.url,
    provider: result.provider,
  });
}
