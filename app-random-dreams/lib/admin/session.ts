import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_NAME,
  ADMIN_SESSION_TTL_MS,
  signSession,
  verifySession
} from "@/lib/admin/token";

export async function getAdminSession(): Promise<boolean> {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return false;
  const store = await cookies();
  return verifySession(store.get(ADMIN_SESSION_NAME)?.value, secret);
}

export function createAdminSessionValue(): string {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return "";
  return signSession(secret, ADMIN_SESSION_TTL_MS);
}

export { ADMIN_SESSION_NAME, ADMIN_SESSION_TTL_MS };
