import "server-only";
import { prisma } from "@/lib/db/prisma";
import { detectImageFormat, imageFileNameFor } from "@/lib/ai/image-format";
import type {
  PipelineStep,
  PipelineStepStatus,
  Prisma
} from "@/lib/generated/prisma/client";

export function getOrderForGeneration(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, formSubmission: true, generatedResult: true }
  });
}

export async function setProcessing(orderId: string) {
  const existing = await prisma.generatedResult.findUnique({ where: { orderId } });
  if (!existing) return null;
  return prisma.generatedResult.update({
    where: { orderId },
    data: {
      aiResponseStatus: "PROCESSING",
      startedAt: existing.startedAt ?? new Date()
    }
  });
}

export function saveTextAndImage(orderId: string, text: string, imageBytes: Uint8Array) {
  return prisma.generatedResult.update({
    where: { orderId },
    data: {
      textContent: text,
      textFileName: "resultado.txt",
      imageBytes: new Uint8Array(imageBytes),
      imageFileName: imageFileNameFor(imageBytes)
    }
  });
}

export function markCompleted(orderId: string) {
  return prisma.generatedResult.update({
    where: { orderId },
    data: { aiResponseStatus: "COMPLETED", completedAt: new Date() }
  });
}

export function markError(orderId: string, message: string) {
  return prisma.generatedResult.update({
    where: { orderId },
    data: { aiResponseStatus: "ERROR", error: message }
  });
}

export async function retryGeneration(orderId: string) {
  const existing = await prisma.generatedResult.findUnique({ where: { orderId } });
  if (!existing || existing.aiResponseStatus !== "ERROR") return null;
  return prisma.generatedResult.update({
    where: { orderId },
    data: {
      aiResponseStatus: "QUEUED",
      error: null,
      startedAt: null,
      completedAt: null,
      textFileName: null,
      textContent: null,
      textFileUrl: null,
      imageFileName: null,
      imageBytes: null,
      imageFileUrl: null,
      retryCount: { increment: 1 }
    }
  });
}

export type ResultFile = {
  found: boolean;
  fileName?: string;
  contentType?: string;
  bytes?: Uint8Array;
};

export async function getResultFile(
  orderId: string,
  formato: "texto" | "imagen"
): Promise<ResultFile> {
  const result = await prisma.generatedResult.findUnique({ where: { orderId } });
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
  options?: { payload?: Prisma.InputJsonValue; error?: string; durationMs?: number }
) {
  return prisma.generationLog.create({
    data: {
      orderId,
      step,
      status,
      payload: options?.payload,
      error: options?.error,
      durationMs: options?.durationMs
    }
  });
}
