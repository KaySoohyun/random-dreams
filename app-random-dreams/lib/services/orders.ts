import "server-only";
import {
  confirmOrderInStore,
  createOrderInStore,
  getCheckoutOrderInStore,
  getOrderByIdInStore,
  getOrderForGenerationInStore,
  getOrderGenerationInStore,
  getStoredOrderInStore,
  hydrateStoredOrder
} from "@/lib/store/orders";
import {
  clearOrderCookie,
  getOrderFromCookie,
  setOrderCookie
} from "@/lib/store/order-cookie";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function createPendingOrder({
  productId,
  formData
}: {
  productId: string;
  formData: Prisma.InputJsonValue;
}) {
  const order = createOrderInStore({
    productId,
    formData: formData as Record<string, unknown>
  });
  await setOrderCookie(order);
  return order;
}

async function hydrateFromCookie(id: string): Promise<void> {
  if (getOrderByIdInStore(id)) return;
  const fromCookie = await getOrderFromCookie(id);
  if (fromCookie) hydrateStoredOrder(fromCookie);
}

export async function getOrderById(id: string) {
  await hydrateFromCookie(id);
  return getOrderByIdInStore(id);
}

export async function getCheckoutOrder(id: string) {
  await hydrateFromCookie(id);
  return getCheckoutOrderInStore(id);
}

export async function getOrderGeneration(id: string) {
  await hydrateFromCookie(id);
  return getOrderGenerationInStore(id);
}

export async function confirmOrder(orderId: string) {
  await hydrateFromCookie(orderId);
  const result = confirmOrderInStore(orderId);
  const raw = getStoredOrderInStore(orderId);
  if (raw) await setOrderCookie(raw);
  return result;
}

export async function getOrderForGeneration(orderId: string) {
  await hydrateFromCookie(orderId);
  return getOrderForGenerationInStore(orderId);
}

export async function syncOrderCookie(orderId: string): Promise<void> {
  const raw = getStoredOrderInStore(orderId);
  if (raw) {
    await setOrderCookie(raw);
  } else {
    await clearOrderCookie(orderId);
  }
}
