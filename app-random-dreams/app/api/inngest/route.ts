import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generationPipeline } from "@/inngest/pipeline";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generationPipeline]
});
