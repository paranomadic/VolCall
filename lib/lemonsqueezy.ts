import crypto from "node:crypto";
import { isLemonSqueezyConfigured } from "@/lib/integrations";

const LS_API = "https://api.lemonsqueezy.com/v1";

export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHex: string | null,
  secret: string,
): boolean {
  if (!signatureHex || !rawBody) return false;
  try {
    const sig = Buffer.from(signatureHex, "hex");
    const hmac = Buffer.from(
      crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
      "hex",
    );
    if (sig.length !== hmac.length) return false;
    return crypto.timingSafeEqual(sig, hmac);
  } catch {
    return false;
  }
}

export function lemonVariantIdForPlan(
  plan: "MONTHLY" | "ANNUAL" | "ANNUAL_CRYPTO",
): string | null {
  if (plan === "MONTHLY") {
    return process.env.LEMONSQUEEZY_VARIANT_MONTHLY ?? null;
  }
  if (plan === "ANNUAL") {
    return process.env.LEMONSQUEEZY_VARIANT_ANNUAL ?? null;
  }
  return null;
}

export async function createLemonCheckout(params: {
  variantId: string;
  userId: string;
  email: string;
  redirectUrl: string;
}): Promise<{ url: string } | { error: string }> {
  if (!isLemonSqueezyConfigured()) {
    return { error: "Lemon Squeezy is not configured." };
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY!;
  const testMode = process.env.LEMONSQUEEZY_TEST_MODE === "true";

  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: params.email,
            custom: { user_id: params.userId },
          },
          product_options: {
            redirect_url: params.redirectUrl,
          },
          test_mode: testMode,
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: params.variantId },
          },
        },
      },
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    data?: { attributes?: { url?: string } };
    errors?: unknown;
  };

  if (!res.ok) {
    const detail =
      json && "errors" in json
        ? JSON.stringify(json.errors)
        : await res.text().catch(() => res.statusText);
    return { error: `Lemon Squeezy checkout failed (${res.status}): ${detail}` };
  }

  const url = json?.data?.attributes?.url;
  if (!url) {
    return { error: "Lemon Squeezy did not return a checkout URL." };
  }

  return { url };
}
