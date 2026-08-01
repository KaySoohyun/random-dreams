import { task } from "@trigger.dev/sdk";
import { messageOf } from "@/lib/utils/message";
import { markError } from "@/lib/services/generation";
import { runGenerationPipeline } from "./pipeline";

export const generateDreamTask = task({
  id: "generate-dream",
  run: async (payload: { orderId: string }) => {
    try {
      await runGenerationPipeline(payload.orderId);
    } catch (error) {
      await markError(payload.orderId, messageOf(error));
      throw error;
    }
  }
});
