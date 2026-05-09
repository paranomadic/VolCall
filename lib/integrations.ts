export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL &&
      process.env.RESEND_FROM_EMAIL.includes("@"),
  );
}

export function isTwilioVerifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_MONTHLY &&
      process.env.STRIPE_PRICE_ANNUAL,
  );
}

/** Primary billing: Lemon Squeezy Checkout (variant IDs per plan + store). */
export function isLemonSqueezyConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_MONTHLY &&
      process.env.LEMONSQUEEZY_VARIANT_ANNUAL,
  );
}

/** Names VolCall expects (must match Vercel env keys exactly). */
export const VAPI_VOICE_ENV_NAMES = [
  "VAPI_API_KEY",
  "VAPI_ASSISTANT_ID",
  "VAPI_PHONE_NUMBER_ID",
] as const;

/** Which Vapi env vars are set — safe for JSON (no secret values). */
export function getVapiVoiceEnvDiagnostics(): {
  VAPI_API_KEY: boolean;
  VAPI_ASSISTANT_ID: boolean;
  VAPI_PHONE_NUMBER_ID: boolean;
  fullyConfigured: boolean;
  missingEnvVars: string[];
} {
  const apiKey = Boolean(process.env.VAPI_API_KEY?.trim());
  const assistantId = Boolean(process.env.VAPI_ASSISTANT_ID?.trim());
  const phoneNumberId = Boolean(process.env.VAPI_PHONE_NUMBER_ID?.trim());
  const missingEnvVars: string[] = [];
  if (!apiKey) missingEnvVars.push("VAPI_API_KEY");
  if (!assistantId) missingEnvVars.push("VAPI_ASSISTANT_ID");
  if (!phoneNumberId) missingEnvVars.push("VAPI_PHONE_NUMBER_ID");
  return {
    VAPI_API_KEY: apiKey,
    VAPI_ASSISTANT_ID: assistantId,
    VAPI_PHONE_NUMBER_ID: phoneNumberId,
    fullyConfigured: apiKey && assistantId && phoneNumberId,
    missingEnvVars,
  };
}

/** Primary IVR/voice for alert calls: Vapi outbound (Twilio remains fallback). */
export function isVapiVoiceConfigured(): boolean {
  return getVapiVoiceEnvDiagnostics().fullyConfigured;
}

/** Twilio Programmable Voice (outbound calls) — fallback when Vapi fails or is unset. */
export function isTwilioVoiceConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}
