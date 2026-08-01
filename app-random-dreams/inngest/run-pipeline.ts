import { getContentProvider, getImageProvider } from "@/lib/ai/factory";
import { interpolateTemplate } from "@/lib/ai/interpolate";
import type { AIContentInput } from "@/lib/ai/types";
import type { PipelineStep } from "@/lib/generated/prisma/client";
import {
  getOrderForGeneration,
  logStep,
  markCompleted,
  saveImage,
  saveText,
  setProcessing
} from "@/lib/services/generation";

export type StepRun = (id: string, fn: () => Promise<unknown>) => Promise<unknown>;

type OrderForGeneration = NonNullable<Awaited<ReturnType<typeof getOrderForGeneration>>>;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function runStep<T>(
  orderId: string,
  run: StepRun,
  step: PipelineStep,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  await run(`log-${step}-running`, () => logStep(orderId, step, "RUNNING"));
  try {
    const result = (await run(`step-${step}`, fn)) as T;
    await run(`log-${step}-success`, () =>
      logStep(orderId, step, "SUCCESS", { durationMs: Date.now() - start })
    );
    return result;
  } catch (error) {
    await run(`log-${step}-failed`, () =>
      logStep(orderId, step, "FAILED", {
        error: messageOf(error),
        durationMs: Date.now() - start
      })
    );
    throw error;
  }
}

export async function runGenerationPipeline(orderId: string, run: StepRun) {
  const order = (await run("load-order", () => getOrderForGeneration(orderId))) as
    | OrderForGeneration
    | null;
  if (!order?.generatedResult) return;
  if (order.generatedResult.aiResponseStatus === "COMPLETED") return;

  await run("mark-processing", () => setProcessing(orderId));

  const input: AIContentInput = {
    productId: order.product.id,
    formData: (order.formSubmission?.formData ?? {}) as Record<string, unknown>,
    aiTextTemplate: order.product.aiTextTemplate,
    aiPromptTemplate: order.product.aiPromptTemplate
  };
  const contentProvider = getContentProvider();

  const generated = await runStep(orderId, run, "GENERATE_TEXT", () =>
    contentProvider.generate(input)
  );
  await runStep(orderId, run, "UPLOAD_RESULT", () => saveText(orderId, generated.text));
  await runStep(orderId, run, "MARK_COMPLETED", () => markCompleted(orderId));
}

export async function runImageGenerationInline(orderId: string) {
  const order = (await getOrderForGeneration(orderId)) as OrderForGeneration | null;
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
