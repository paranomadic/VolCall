import twilio from "twilio";
import { isVapiVoiceConfigured } from "@/lib/integrations";
import { placeVapiOutboundCall } from "@/lib/vapi-call";

export async function placeOutboundVoiceAlert(params: {
  e164: string;
  asset: string;
  dvol: number;
  band: string;
}): Promise<{ ok: true; channel: "vapi" | "twilio"; id?: string } | { ok: false; message: string }> {
  if (isVapiVoiceConfigured()) {
    const vapi = await placeVapiOutboundCall({
      e164: params.e164,
      asset: params.asset,
      dvol: params.dvol,
      band: params.band,
    });
    if (vapi.ok) {
      return { ok: true, channel: "vapi", id: vapi.id };
    }
    console.warn(
      `[volcall] vapi failed (${vapi.message}), trying Twilio fallback`,
    );
  }

  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    return {
      ok: false,
      message:
        "No voice provider: set VAPI_* or TWILIO_FROM_NUMBER (+ Twilio auth).",
    };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
  const twiml = `<Response><Say voice="Polly.Joanna">Hello, this is VolCall. ${params.asset} implied volatility is at ${params.dvol.toFixed(
    1,
  )}, band ${params.band}. Please review your positions. Press 9 to opt out on future marketing calls where allowed.</Say></Response>`;

  const call = await client.calls.create({
    to: params.e164,
    from,
    twiml,
  });
  return { ok: true, channel: "twilio", id: call.sid };
}
