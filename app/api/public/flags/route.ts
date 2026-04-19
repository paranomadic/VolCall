import { NextResponse } from "next/server";
import {
  isLemonSqueezyConfigured,
  isResendConfigured,
  isStripeCheckoutConfigured,
  isTwilioVerifyConfigured,
} from "@/lib/integrations";

export async function GET() {
  return NextResponse.json({
    emailVerification: isResendConfigured(),
    twilioVerify: isTwilioVerifyConfigured(),
    lemonSqueezyCheckout: isLemonSqueezyConfigured(),
    stripeCheckout: isStripeCheckoutConfigured(),
  });
}
