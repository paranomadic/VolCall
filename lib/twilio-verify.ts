import twilio from "twilio";
import { isTwilioVerifyConfigured } from "@/lib/integrations";

function client() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
}

export async function sendVerificationCode(e164: string): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (!isTwilioVerifyConfigured()) {
    return { ok: false, message: "Twilio Verify not configured" };
  }
  try {
    await client().verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: e164, channel: "sms" });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Twilio error";
    return { ok: false, message: msg };
  }
}

export async function checkVerificationCode(
  e164: string,
  code: string,
): Promise<boolean> {
  if (!isTwilioVerifyConfigured()) return false;
  try {
    const check = await client().verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: e164, code });
    return check.status === "approved";
  } catch {
    return false;
  }
}
