import { getContentProvider, getImageProvider } from "@/lib/ai/factory";
import { interpolateTemplate } from "@/lib/ai/interpolate";
import type { AIContentInput } from "@/lib/ai/types";
import type { PipelineStep } from "@/lib/generated/prisma/client";
import { messageOf } from "@/lib/utils/message";
import {
  getOrderForGeneration,
  logStep,
  markCompleted,
  markError,
  saveImage,
  saveText,
  setProcessing
} from "@/lib/services/generation";

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

  const formData = (order.formSubmission?.formData ?? {}) as Record<string, unknown>;
  const input: AIContentInput = {
    productId: order.product.id,
    formData,
    aiTextTemplate: order.product.aiTextTemplate,
    aiPromptTemplate: order.product.aiPromptTemplate
  };

  const generated = await runStep(orderId, "GENERATE_TEXT", () =>
    getContentProvider().generate(input)
  );
  await runStep(orderId, "UPLOAD_RESULT", () => saveText(orderId, generated.text));

  try {
    await generateImageStep(
      orderId,
      order.product.aiPromptTemplate,
      formData,
      Boolean(order.generatedResult.imageBytes)
    );
  } catch {
    // La imagen falló pero el texto ya está listo: se mantiene COMPLETED y
    // la página ofrece el botón para reintentar la imagen.
  }

  await runStep(orderId, "MARK_COMPLETED", () => markCompleted(orderId));
}

export async function runGenerationInline(orderId: string) {
  try {
    await runGenerationPipeline(orderId);
  } catch (error) {
    await markError(orderId, messageOf(error));
  }
}

async function generateImageStep(
  orderId: string,
  aiPromptTemplate: string,
  formData: Record<string, unknown>,
  hasImage: boolean
): Promise<void> {
  if (hasImage) return;

  const imagePrompt = interpolateTemplate(aiPromptTemplate, formData);
  await runStep(orderId, "GENERATE_IMAGE", async () => {
    const buffer = await getImageProvider().generate(imagePrompt);
    await saveImage(orderId, new Uint8Array(buffer));
  });
}

export async function runImageGenerationInline(orderId: string) {
  const order = await getOrderForGeneration(orderId);
  if (!order?.generatedResult) return;

  await generateImageStep(
    orderId,
    order.product.aiPromptTemplate,
    (order.formSubmission?.formData ?? {}) as Record<string, unknown>,
    Boolean(order.generatedResult.imageBytes)
  );
}
