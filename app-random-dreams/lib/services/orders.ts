import "server-only";
import {
  confirmOrderInStore,
  createOrderInStore,
  getCheckoutOrderInStore,
  getOrderByIdInStore,
  getOrderForGenerationInStore,
  getOrderGenerationInStore
} from "@/lib/store/orders";
import type { Prisma } from "@/lib/generated/prisma/client";

export function createPendingOrder({
  productId,
  formData
}: {
  productId: string;
  formData: Prisma.InputJsonValue;
}) {
  return createOrderInStore({
    productId,
    formData: formData as Record<string, unknown>
  });
}

export function getOrderById(id: string) {
  return getOrderByIdInStore(id);
}

export function getCheckoutOrder(id: string) {
  return getCheckoutOrderInStore(id);
}

export function getOrderGeneration(id: string) {
  return getOrderGenerationInStore(id);
}

export function confirmOrder(orderId: string) {
  return confirmOrderInStore(orderId);
}

export function getOrderForGeneration(orderId: string) {
  return getOrderForGenerationInStore(orderId);
}
