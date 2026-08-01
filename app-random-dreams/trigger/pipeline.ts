import { getContentProvider, getImageProvider } from "@/lib/ai/factory";
import { interpolateTemplate } from "@/lib/ai/interpolate";
import type { AIContentInput } from "@/lib/ai/types";
import type { PipelineStep } from "@/lib/generated/prisma/client";
import {
  getOrderForGeneration,
  logStep,
  markCompleted,
  markError,
  saveImage,
  saveText,
  setProcessing
} from "@/lib/services/generation";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function runStep<T>(orderId: string, step: PipelineStep, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  await logStep(orderId, step, "RUNNING");
  try {
    const result = await fn();
    await logStep(orderId, step, "SUCCESS", { durationMs: Date.now() - start });
    return result;
  } catch (error) {
    await logStep(orderId, step, "FAILED", {
      error: messageOf(error),
      durationMs: Date.now() - start
    });
    throw error;
  }
}

export async function runGenerationPipeline(orderId: string) {
  const order = await getOrderForGeneration(orderId);
  if (!order?.generatedResult) return;
  if (order.generatedResult.aiResponseStatus === "COMPLETED") return;

  await setProcessing(orderId);

  const input: AIContentInput = {
    productId: order.product.id,
    formData: (order.formSubmission?.formData ?? {}) as Record<string, unknown>,
    aiTextTemplate: order.product.aiTextTemplate,
    aiPromptTemplate: order.product.aiPromptTemplate
  };
  const contentProvider = getContentProvider();

  const generated = await runStep(orderId, "GENERATE_TEXT", () =>
    contentProvider.generate(input)
  );
  await runStep(orderId, "UPLOAD_RESULT", () => saveText(orderId, generated.text));
  await runStep(orderId, "MARK_COMPLETED", () => markCompleted(orderId));
}

export async function runGenerationInline(orderId: string) {
  try {
    await runGenerationPipeline(orderId);
  } catch (error) {
    await markError(orderId, messageOf(error));
  }
}

export async function runImageGenerationInline(orderId: string) {
  const order = await getOrderForGeneration(orderId);
  if (!order?.generatedResult) return;
  if (order.generatedResult.imageBytes) return;

  const imagePrompt = interpolateTemplate(
    order.product.aiPromptTemplate,
    (order.formSubmission?.formData ?? {}) as Record<string, unknown>
  );

  const imageProvider = getImageProvider();
  const start = Date.now();
  await logStep(orderId, "GENERATE_IMAGE", "RUNNING");
  try {
    const buffer = await imageProvider.generate(imagePrompt);
    await saveImage(orderId, new Uint8Array(buffer));
    await logStep(orderId, "GENERATE_IMAGE", "SUCCESS", { durationMs: Date.now() - start });
  } catch (error) {
    await logStep(orderId, "GENERATE_IMAGE", "FAILED", {
      error: messageOf(error),
      durationMs: Date.now() - start
    });
    throw error;
  }
}
