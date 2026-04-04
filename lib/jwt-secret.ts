/**
 * HS256 key material shared by middleware (verify) and Route Handlers (sign).
 * Trims JWT_SECRET to avoid subtle .env whitespace mismatches.
 */

export function getJwtSecretForVerify(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (s && s.length >= 16) {
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("dev-insecure-secret-change-me");
  }
  // Production without a valid secret: nothing verifies (fail closed).
  return new TextEncoder().encode("__volcall_missing_jwt_secret__");
}

export function getJwtSecretForSigning(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (s && s.length >= 16) {
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("dev-insecure-secret-change-me");
  }
  throw new Error("JWT_SECRET must be set (min 16 characters) in production");
}
