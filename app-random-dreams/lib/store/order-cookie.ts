import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { StoredOrder } from "./orders";

const COOKIE_PREFIX = "rd_order_";
const MAX_COOKIE_BYTES = 3500;
const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function secret(): string {
  const configured = process.env.ORDER_COOKIE_SECRET;
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? "random-dreams-prod-order-cookie-fallback"
    : "random-dreams-dev-order-cookie-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function serializeForCookie(order: StoredOrder): string {
  const withoutImage = {
    ...order,
    result: order.result
      ? { ...order.result, imageBytes: null }
      : null
  };
  let json = JSON.stringify(withoutImage);
  if (Buffer.byteLength(json, "utf8") > MAX_COOKIE_BYTES && order.result?.textContent) {
    const withoutText = {
      ...order,
      result: order.result ? { ...order.result, textContent: null, imageBytes: null } : null
    };
    json = JSON.stringify(withoutText);
  }
  return json;
}

export async function setOrderCookie(order: StoredOrder): Promise<void> {
  try {
    const store = await cookies();
    const payload = Buffer.from(serializeForCookie(order), "utf8").toString("base64url");
    store.set(COOKIE_PREFIX + order.id, `${payload}.${sign(payload)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS
    });
  } catch {
    // Sin request scope (tests, pipeline) la cookie se ignora.
  }
}

export async function getOrderFromCookie(id: string): Promise<StoredOrder | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_PREFIX + id)?.value;
    if (!raw) return null;
    const dot = raw.lastIndexOf(".");
    if (dot <= 0) return null;
    const payload = raw.slice(0, dot);
    const signature = raw.slice(dot + 1);
    const expected = sign(payload);
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const order = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StoredOrder;
    if (order.id !== id) return null;
    return order;
  } catch {
    return null;
  }
}

export async function clearOrderCookie(id: string): Promise<void> {
  try {
    const store = await cookies();
    store.delete(COOKIE_PREFIX + id);
  } catch {
    // Sin request scope la cookie se ignora.
  }
}
