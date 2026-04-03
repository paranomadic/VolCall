import { Resend } from "resend";
import { getAppUrl } from "@/lib/app-url";
import { isResendConfigured } from "@/lib/integrations";

export async function sendVerificationEmail(params: {
  to: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isResendConfigured()) {
    return { ok: false, reason: "Resend not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from = process.env.RESEND_FROM_EMAIL!;
  const url = `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(params.token)}`;

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: "Verify your VolCall email",
    html: `<p>Thanks for signing up for VolCall.</p><p><a href="${url}">Verify your email</a></p><p>If you did not sign up, you can ignore this message.</p>`,
    text: `Verify your VolCall email: ${url}`,
  });

  if (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}
