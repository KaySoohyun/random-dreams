import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_NAME = "admin_session";
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function verifyAdminToken(input: string): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export function signSession(secret: string, ttlMs: number, nowMs = Date.now()): string {
  const expiresAt = nowMs + ttlMs;
  const signature = createHmac("sha256", secret)
    .update(`admin-session:${expiresAt}`)
    .digest("base64url");
  return `${expiresAt}.${signature}`;
}

export function verifySession(
  value: string | undefined,
  secret: string,
  nowMs = Date.now()
): boolean {
  if (!value) return false;
  const [expiresAtRaw, signature] = value.split(".");
  if (!expiresAtRaw || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return false;
  if (nowMs >= expiresAt) return false;

  const expected = createHmac("sha256", secret)
    .update(`admin-session:${expiresAt}`)
    .digest("base64url");
  const inputBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer)
  );
}
