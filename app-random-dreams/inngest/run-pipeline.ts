import { getContentProvider, getImageProvider } from "@/lib/ai/factory";
import type { AIContentInput } from "@/lib/ai/types";
import type { PipelineStep } from "@/lib/generated/prisma/client";
import {
  getOrderForGeneration,
  logStep,
  markCompleted,
  saveTextAndImage,
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
  const imageProvider = getImageProvider();

  const generated = await runStep(orderId, run, "GENERATE_TEXT", () =>
    contentProvider.generate(input)
  );
  const imageBytes: number[] = await runStep(orderId, run, "GENERATE_IMAGE", async () => {
    const buffer = await imageProvider.generate(generated.imagePrompt);
    return Array.from(new Uint8Array(buffer));
  });
  await runStep(orderId, run, "UPLOAD_RESULT", () =>
    saveTextAndImage(orderId, generated.text, new Uint8Array(imageBytes))
  );
  await runStep(orderId, run, "MARK_COMPLETED", () => markCompleted(orderId));
}
