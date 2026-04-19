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

/** Primary IVR/voice for alert calls: Vapi outbound (Twilio remains fallback). */
export function isVapiVoiceConfigured(): boolean {
  return Boolean(
    process.env.VAPI_API_KEY &&
      process.env.VAPI_ASSISTANT_ID &&
      process.env.VAPI_PHONE_NUMBER_ID,
  );
}
