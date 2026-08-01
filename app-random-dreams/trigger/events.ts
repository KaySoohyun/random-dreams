import { tasks } from "@trigger.dev/sdk";
import type { generateTextTask } from "./tasks";

export async function sendOrderConfirmed(orderId: string) {
  await tasks.trigger<typeof generateTextTask>("generate-text", { orderId });
}
