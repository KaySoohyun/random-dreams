import { tasks } from "@trigger.dev/sdk";
import type { generateDreamTask } from "./tasks";

export async function sendOrderConfirmed(orderId: string) {
  await tasks.trigger<typeof generateDreamTask>("generate-dream", { orderId });
}
