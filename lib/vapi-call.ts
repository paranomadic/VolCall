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

  const variableOverrides =
    process.env.VAPI_USE_VARIABLE_VALUES === "true"
      ? {
          assistantOverrides: {
            variableValues: {
              asset: params.asset,
              dvol: params.dvol.toFixed(1),
              band: params.band,
            },
          },
        }
      : {};

  const flatBody: Record<string, unknown> = {
    assistantId,
    phoneNumberId,
    customer: { number: params.e164 },
    ...variableOverrides,
  };

  const nestedBody: Record<string, unknown> = {
    assistant: { assistantId },
    phoneNumberId,
    customer: { number: params.e164 },
    ...variableOverrides,
  };

  async function post(body: Record<string, unknown>) {
    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return { res, text };
  }

  let { res, text } = await post(flatBody);
  if (!res.ok && res.status >= 400 && res.status < 500) {
    const second = await post(nestedBody);
    res = second.res;
    text = second.text;
  }

  if (!res.ok) {
    return {
      ok: false,
      message: `${res.status} ${text.slice(0, 1200)}`,
    };
  }

  const data = (() => {
    try {
      return JSON.parse(text) as { id?: string };
    } catch {
      return {};
    }
  })();

  return { ok: true, id: data.id };
}
