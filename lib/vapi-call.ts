import { isVapiVoiceConfigured } from "@/lib/integrations";

/**
 * Outbound alert call via Vapi (IVR / voice agent).
 * Configure assistant + phone number in the Vapi dashboard; optional template variables
 * if your assistant defines `asset`, `dvol`, and `band`.
 */
export async function placeVapiOutboundCall(params: {
  e164: string;
  asset: string;
  dvol: number;
  band: string;
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  if (!isVapiVoiceConfigured()) {
    return { ok: false, message: "Vapi is not configured" };
  }

  const apiKey = process.env.VAPI_API_KEY!;
  const assistantId = process.env.VAPI_ASSISTANT_ID!;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID!;

  const body: Record<string, unknown> = {
    assistantId,
    phoneNumberId,
    customer: { number: params.e164 },
  };

  if (process.env.VAPI_USE_VARIABLE_VALUES === "true") {
    body.assistantOverrides = {
      variableValues: {
        asset: params.asset,
        dvol: params.dvol.toFixed(1),
        band: params.band,
      },
    };
  }

  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, message: `${res.status} ${t}` };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}
