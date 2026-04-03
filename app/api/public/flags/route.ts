import { NextResponse } from "next/server";
import {
  isResendConfigured,
  isStripeCheckoutConfigured,
  isTwilioVerifyConfigured,
} from "@/lib/integrations";

export async function GET() {
  return NextResponse.json({
    emailVerification: isResendConfigured(),
    twilioVerify: isTwilioVerifyConfigured(),
    stripeCheckout: isStripeCheckoutConfigured(),
  });
}
