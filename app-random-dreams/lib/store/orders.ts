import { randomUUID } from "node:crypto";
import type { CatalogProduct } from "@/lib/data/products";
import { getProductByIdData } from "@/lib/data/products";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AiResponseStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "ERROR";

export type PipelineStep = "GENERATE_TEXT" | "GENERATE_IMAGE" | "UPLOAD_RESULT" | "MARK_COMPLETED";

export type PipelineStepStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type StoredResult = {
  aiResponseStatus: AiResponseStatus;
  textContent: string | null;
  imageBytes: Uint8Array | null;
  error: string | null;
  retryCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredOrder = {
  id: string;
  productId: string;
  paymentStatus: PaymentStatus;
  confirmedAt: Date | null;
  formData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  result: StoredResult | null;
};

export type StoredGenerationLog = {
  id: string;
  orderId: string;
  step: PipelineStep;
  status: PipelineStepStatus;
  error: string | null;
  durationMs: number | null;
  createdAt: Date;
};

const PENDING_TTL_MS = 60 * 60 * 1000;
const COMPLETED_TTL_MS = 24 * 60 * 60 * 1000;
const LOG_TTL_MS = 24 * 60 * 60 * 1000;

const globalForStore = globalThis as unknown as { __orderStore?: Map<string, StoredOrder> };

const orders: Map<string, StoredOrder> =
  globalForStore.__orderStore ?? new Map<string, StoredOrder>();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__orderStore = orders;
}

export const logs: Map<string, StoredGenerationLog> = new Map<string, StoredGenerationLog>();

export function createOrderInStore({
  productId,
  formData
}: {
  productId: string;
  formData: Record<string, unknown>;
}): StoredOrder {
  const now = new Date();
  const order: StoredOrder = {
    id: randomUUID(),
    productId,
    paymentStatus: "PENDING",
    confirmedAt: null,
    formData,
    createdAt: now,
    updatedAt: now,
    result: null
  };
  orders.set(order.id, order);
  return order;
}

export function getOrderInStore(id: string): StoredOrder | null {
  const order = orders.get(id);
  if (!order) return null;
  if (isExpired(order)) {
    orders.delete(id);
    return null;
  }
  return order;
}

export function updateOrderInStore(
  id: string,
  patch: Partial<Pick<StoredOrder, "paymentStatus" | "confirmedAt" | "formData">>
): StoredOrder | null {
  const order = getOrderInStore(id);
  if (!order) return null;
  const updated = { ...order, ...patch, updatedAt: new Date() };
  orders.set(id, updated);
  return updated;
}

export function resolveProduct(order: StoredOrder): CatalogProduct | null {
  return getProductByIdData(order.productId);
}

function isExpired(order: StoredOrder): boolean {
  const ttl = order.paymentStatus === "PENDING" ? PENDING_TTL_MS : COMPLETED_TTL_MS;
  return Date.now() - order.updatedAt.getTime() > ttl;
}

function resultOf(orderId: string): StoredResult {
  const order = getOrderInStore(orderId);
  if (!order) throw new Error(`Pedido ${orderId} no encontrado en el store`);
  if (!order.result) {
    order.result = {
      aiResponseStatus: "QUEUED",
      textContent: null,
      imageBytes: null,
      error: null,
      retryCount: 0,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    orders.set(orderId, order);
  }
  return order.result;
}

export function setResultStatus(
  orderId: string,
  patch: Partial<Pick<StoredResult, "aiResponseStatus" | "error" | "startedAt" | "completedAt">>
): void {
  const result = resultOf(orderId);
  Object.assign(result, patch, { updatedAt: new Date() });
}

export function saveResultText(orderId: string, text: string): void {
  const result = resultOf(orderId);
  Object.assign(result, {
    textContent: text,
    updatedAt: new Date()
  });
}

export function saveResultImage(orderId: string, imageBytes: Uint8Array): void {
  const result = resultOf(orderId);
  Object.assign(result, {
    imageBytes: new Uint8Array(imageBytes),
    updatedAt: new Date()
  });
}

export function resetResultForRetry(orderId: string): StoredResult | null {
  const order = getOrderInStore(orderId);
  if (!order?.result || order.result.aiResponseStatus !== "ERROR") return null;
  Object.assign(order.result, {
    aiResponseStatus: "QUEUED",
    error: null,
    startedAt: null,
    completedAt: null,
    textContent: null,
    imageBytes: null,
    retryCount: order.result.retryCount + 1,
    updatedAt: new Date()
  });
  orders.set(orderId, order);
  return order.result;
}

export function clearStaleOrders(): number {
  let removed = 0;
  for (const [id, order] of orders) {
    if (isExpired(order)) {
      orders.delete(id);
      removed++;
    }
  }
  for (const [id, log] of logs) {
    if (Date.now() - log.createdAt.getTime() > LOG_TTL_MS) {
      logs.delete(id);
      removed++;
    }
  }
  return removed;
}

export function resetStoreForTests(): void {
  orders.clear();
  logs.clear();
}

export function logStepInStore(
  orderId: string,
  step: PipelineStep,
  status: PipelineStepStatus,
  options?: { error?: string; durationMs?: number }
): void {
  const id = randomUUID();
  logs.set(id, {
    id,
    orderId,
    step,
    status,
    error: options?.error ?? null,
    durationMs: options?.durationMs ?? null,
    createdAt: new Date()
  });
}

export function getLogsForOrder(orderId: string): StoredGenerationLog[] {
  return Array.from(logs.values())
    .filter((log) => log.orderId === orderId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function countLogsForOrder(orderId: string): number {
  return getLogsForOrder(orderId).length;
}

export type OrderView = {
  id: string;
  productId: string;
  paymentStatus: PaymentStatus;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: CatalogProduct | null;
};

export type CheckoutOrderView = {
  id: string;
  productId: string;
  paymentStatus: PaymentStatus;
  confirmedAt: Date | null;
  product: Pick<CatalogProduct, "id" | "slug" | "name" | "description" | "formSchema">;
  formSubmission: { orderId: string; formData: Record<string, unknown> | null } | null;
};

export type GenerationOrderView = {
  id: string;
  productId: string;
  paymentStatus: PaymentStatus;
  product: Pick<CatalogProduct, "id" | "slug" | "name">;
  generatedResult: StoredResult | null;
};

export type PipelineOrderView = {
  id: string;
  productId: string;
  product: Pick<
    CatalogProduct,
    "id" | "slug" | "formSchema" | "aiTextTemplate" | "aiPromptTemplate"
  >;
  formSubmission: { orderId: string; formData: Record<string, unknown> | null } | null;
  generatedResult: StoredResult | null;
};

export function getOrderByIdInStore(id: string): OrderView | null {
  const order = getOrderInStore(id);
  if (!order) return null;
  return {
    id: order.id,
    productId: order.productId,
    paymentStatus: order.paymentStatus,
    confirmedAt: order.confirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    product: resolveProduct(order)
  };
}

export function getCheckoutOrderInStore(id: string): CheckoutOrderView | null {
  const order = getOrderInStore(id);
  if (!order) return null;
  const product = resolveProduct(order);
  if (!product) return null;
  return {
    id: order.id,
    productId: order.productId,
    paymentStatus: order.paymentStatus,
    confirmedAt: order.confirmedAt,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      formSchema: product.formSchema
    },
    formSubmission: { orderId: order.id, formData: order.formData }
  };
}

export function getOrderGenerationInStore(id: string): GenerationOrderView | null {
  const order = getOrderInStore(id);
  if (!order) return null;
  const product = resolveProduct(order);
  if (!product) return null;
  return {
    id: order.id,
    productId: order.productId,
    paymentStatus: order.paymentStatus,
    product: { id: product.id, slug: product.slug, name: product.name },
    generatedResult: order.result
  };
}

export function getOrderForGenerationInStore(id: string): PipelineOrderView | null {
  const order = getOrderInStore(id);
  if (!order) return null;
  const product = resolveProduct(order);
  if (!product) return null;
  return {
    id: order.id,
    productId: order.productId,
    product: {
      id: product.id,
      slug: product.slug,
      formSchema: product.formSchema,
      aiTextTemplate: product.aiTextTemplate,
      aiPromptTemplate: product.aiPromptTemplate
    },
    formSubmission: { orderId: order.id, formData: order.formData },
    generatedResult: order.result
  };
}

export function confirmOrderInStore(orderId: string) {
  const order = getOrderInStore(orderId);
  if (!order) return { order: null, transitioned: false };
  if (order.paymentStatus === "REJECTED") {
    return { order: getOrderGenerationInStore(orderId), transitioned: false };
  }
  if (order.paymentStatus === "APPROVED") {
    resultOf(orderId);
    return { order: getOrderGenerationInStore(orderId), transitioned: false };
  }
  updateOrderInStore(orderId, { paymentStatus: "APPROVED", confirmedAt: new Date() });
  resultOf(orderId);
  return { order: getOrderGenerationInStore(orderId), transitioned: true };
}
