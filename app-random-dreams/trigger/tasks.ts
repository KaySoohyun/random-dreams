import { task } from "@trigger.dev/sdk";
import { markError } from "@/lib/services/generation";
import { runGenerationPipeline } from "./pipeline";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const generateTextTask = task({
  id: "generate-text",
  retry: { maxAttempts: 5, minTimeoutInMs: 5_000 },
  run: async (payload: { orderId: string }) => {
    try {
      await runGenerationPipeline(payload.orderId);
    } catch (error) {
      await markError(payload.orderId, messageOf(error));
      throw error;
    }
  }
});
