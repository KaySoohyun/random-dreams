import { inngest } from "./client";
import { orderConfirmedEvent } from "./events";
import { runGenerationPipelineWithErrors } from "./run-with-errors";

export const generationPipeline = inngest.createFunction(
  {
    id: "generation-pipeline",
    name: "Pipeline de generación",
    retries: 5,
    triggers: [orderConfirmedEvent]
  },
  async ({ event, step }) => {
    await runGenerationPipelineWithErrors(event.data.orderId, step.run);
  }
);
