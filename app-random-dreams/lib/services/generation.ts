import "server-only";
import {
  getOrderForGenerationInStore,
  logStepInStore,
  resetResultForRetry,
  saveResultImage,
  saveResultText,
  setResultStatus,
  type PipelineStep,
  type PipelineStepStatus,
  type StoredResult
} from "@/lib/store/orders";
import { detectImageFormat } from "@/lib/ai/image-format";

export function getOrderForGeneration(orderId: string) {
  return getOrderForGenerationInStore(orderId);
}

export function setProcessing(orderId: string): StoredResult | null {
  const order = getOrderForGenerationInStore(orderId);
  if (!order?.generatedResult) return null;
  setResultStatus(orderId, {
    aiResponseStatus: "PROCESSING",
    startedAt: order.generatedResult.startedAt ?? new Date()
  });
  return order.generatedResult;
}

export function saveText(orderId: string, text: string): void {
  saveResultText(orderId, text);
}

export function saveImage(orderId: string, imageBytes: Uint8Array): void {
  saveResultImage(orderId, imageBytes);
}

export function markCompleted(orderId: string): void {
  setResultStatus(orderId, { aiResponseStatus: "COMPLETED", completedAt: new Date() });
}

export function markError(orderId: string, message: string): void {
  setResultStatus(orderId, { aiResponseStatus: "ERROR", error: message });
}

export function retryGeneration(orderId: string): StoredResult | null {
  return resetResultForRetry(orderId);
}

export function getResultText(orderId: string): string | null {
  return getOrderForGenerationInStore(orderId)?.generatedResult?.textContent ?? null;
}

export type ResultFile = {
  found: boolean;
  fileName?: string;
  contentType?: string;
  bytes?: Uint8Array;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function firstNameValue(
  formSchema: unknown,
  formData: Record<string, unknown> | null
): string | null {
  const schema = formSchema as { fields?: Array<{ name: string; type: string }> } | null;
  const firstTextField = schema?.fields?.find((field) => field.type === "text");
  const raw = firstTextField && formData ? formData[firstTextField.name] : undefined;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function buildResultBaseName({
  slug,
  nameValue,
  date = new Date()
}: {
  slug: string;
  nameValue: string | null;
  date?: Date;
}): string {
  const base = nameValue ? `${slug}-${slugify(nameValue)}` : slug;
  return `${base}-${formatDate(date)}`;
}

export function buildResultFileName({
  slug,
  nameValue,
  extension,
  date = new Date()
}: {
  slug: string;
  nameValue: string | null;
  extension: string;
  date?: Date;
}): string {
  return `${buildResultBaseName({ slug, nameValue, date })}.${extension}`;
}

export function getResultFileName(
  orderId: string,
  extension: string,
  date = new Date()
): string | null {
  const context = firstNameFieldValue(orderId);
  return context ? buildResultFileName({ ...context, extension, date }) : null;
}

function firstNameFieldValue(
  orderId: string
): { slug: string; nameValue: string | null } | null {
  const order = getOrderForGenerationInStore(orderId);
  if (!order) return null;
  const nameValue = firstNameValue(
    order.product.formSchema,
    order.formSubmission?.formData ?? null
  );
  return { slug: order.product.slug, nameValue };
}

export function getResultFile(orderId: string, formato: "texto" | "imagen"): ResultFile {
  const result = getOrderForGenerationInStore(orderId)?.generatedResult;
  if (!result) return { found: false };
  const context = firstNameFieldValue(orderId);

  if (formato === "texto") {
    if (!result.textContent) return { found: false };
    return {
      found: true,
      fileName: context
        ? buildResultFileName({ ...context, extension: "txt" })
        : "resultado.txt",
      contentType: "text/plain; charset=utf-8",
      bytes: new TextEncoder().encode(result.textContent)
    };
  }

  if (!result.imageBytes) return { found: false };
  const bytes = new Uint8Array(result.imageBytes);
  const format = detectImageFormat(bytes);
  const contentType =
    format === "jpg" ? "image/jpeg" : format === "png" ? "image/png" : "application/octet-stream";
  const fileName = context
    ? buildResultFileName({ ...context, extension: format })
    : `resultado.${format}`;
  return {
    found: true,
    fileName,
    contentType,
    bytes
  };
}

export function logStep(
  orderId: string,
  step: PipelineStep,
  status: PipelineStepStatus,
  options?: { payload?: unknown; error?: string; durationMs?: number }
): void {
  logStepInStore(orderId, step, status, options);
}
