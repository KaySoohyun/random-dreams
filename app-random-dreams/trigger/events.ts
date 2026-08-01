import { tasks } from "@trigger.dev/sdk";
import { runGenerationInline } from "./pipeline";
import type { generateDreamTask } from "./tasks";

export async function sendOrderConfirmed(orderId: string) {
  await tasks.trigger<typeof generateDreamTask>("generate-dream", { orderId });
}

export async function enqueueGeneration(orderId: string) {
  try {
    await sendOrderConfirmed(orderId);
  } catch (error) {
    console.warn("No se pudo encolar en Trigger.dev; se genera en línea:", error);
    await runGenerationInline(orderId);
  }
}
