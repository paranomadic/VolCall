import { isResendConfigured } from "@/lib/integrations";

/** When Resend is configured, flows that require a verified inbox should enforce it. */
export function enforceEmailVerification(): boolean {
  return isResendConfigured();
}
