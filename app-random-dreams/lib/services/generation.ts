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

export function getResultFile(orderId: string, formato: "texto" | "imagen"): ResultFile {
  const result = getOrderForGenerationInStore(orderId)?.generatedResult;
  if (!result) return { found: false };

  if (formato === "texto") {
    if (!result.textContent) return { found: false };
    return {
      found: true,
      fileName: result.textFileName ?? "resultado.txt",
      contentType: "text/plain; charset=utf-8",
      bytes: new TextEncoder().encode(result.textContent)
    };
  }

  if (!result.imageBytes) return { found: false };
  const bytes = new Uint8Array(result.imageBytes);
  const format = detectImageFormat(bytes);
  const contentType =
    format === "jpg" ? "image/jpeg" : format === "png" ? "image/png" : "application/octet-stream";
  return {
    found: true,
    fileName: result.imageFileName ?? `resultado.${format}`,
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
