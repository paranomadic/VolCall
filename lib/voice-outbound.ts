import twilio from "twilio";
import { isTwilioVoiceConfigured, isVapiVoiceConfigured } from "@/lib/integrations";
import { placeVapiOutboundCall } from "@/lib/vapi-call";

export async function placeOutboundVoiceAlert(params: {
  e164: string;
  asset: string;
  dvol: number;
  band: string;
}): Promise<{ ok: true; channel: "vapi" | "twilio"; id?: string } | { ok: false; message: string }> {
  let vapiErr: string | undefined;

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
    vapiErr = vapi.message;
    console.warn(`[volcall] vapi failed (${vapi.message}), trying Twilio fallback`);
  }

  if (!isTwilioVoiceConfigured()) {
    const base =
      "No outbound voice configured on the server. Set VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID (Vapi), and/or TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (Twilio). Add these in Vercel → Environment Variables and redeploy.";
    if (vapiErr) {
      return {
        ok: false,
        message: `Vapi request failed: ${vapiErr} Twilio voice is not configured for fallback.`,
      };
    }
    return { ok: false, message: base };
  }

  const from = process.env.TWILIO_FROM_NUMBER!;
  try {
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
  } catch (e) {
    const twilioMsg = e instanceof Error ? e.message : String(e);
    if (vapiErr) {
      return {
        ok: false,
        message: `Vapi failed: ${vapiErr} Twilio failed: ${twilioMsg}`,
      };
    }
    return { ok: false, message: `Twilio call failed: ${twilioMsg}` };
  }
}
