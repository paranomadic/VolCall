import twilio from "twilio";
import {
  getVapiVoiceEnvDiagnostics,
  isTwilioVoiceConfigured,
  isVapiVoiceConfigured,
  VAPI_VOICE_ENV_NAMES,
} from "@/lib/integrations";
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
    const vapiDiag = getVapiVoiceEnvDiagnostics();
    if (vapiErr) {
      return {
        ok: false,
        message: `Vapi API error: ${vapiErr} (Twilio fallback not configured.)`,
      };
    }
    if (!vapiDiag.fullyConfigured) {
      const missing = vapiDiag.missingEnvVars.join(", ");
      return {
        ok: false,
        message:
          vapiDiag.missingEnvVars.length === VAPI_VOICE_ENV_NAMES.length
            ? `Vapi env not loaded — add all three in Vercel (exact names): ${missing}. Enable for Production, save, then Redeploy. Twilio is optional.`
            : `Vapi incomplete — missing: ${missing}. All three must be non-empty. Check spelling (underscores), no stray spaces; redeploy after saving.`,
      };
    }
    return {
      ok: false,
      message:
        "Voice misconfiguration (unexpected). Try redeploy; optional Twilio fallback: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
    };
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
