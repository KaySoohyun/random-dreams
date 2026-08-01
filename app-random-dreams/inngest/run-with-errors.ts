import { NonRetriableError } from "inngest";
import { TransientAIError } from "@/lib/ai/types";
import { markError } from "@/lib/services/generation";
import { runGenerationPipeline, runImageGenerationInline, type StepRun } from "./run-pipeline";

export { runImageGenerationInline };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const inlineRun: StepRun = (_id, fn) => fn();

export async function runGenerationPipelineWithErrors(orderId: string, run: StepRun) {
  try {
    await runGenerationPipeline(orderId, run);
  } catch (error) {
    if (error instanceof TransientAIError) throw error;
    await run("mark-error", () => markError(orderId, messageOf(error)));
    throw new NonRetriableError(messageOf(error), { cause: error });
  }
}

export async function runGenerationInline(orderId: string) {
  try {
    await runGenerationPipeline(orderId, inlineRun);
  } catch (error) {
    await markError(orderId, messageOf(error));
  }
}
