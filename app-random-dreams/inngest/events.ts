import { eventType } from "inngest";
import { z } from "zod";
import { inngest } from "./client";

export const orderConfirmedEvent = eventType("order/confirmed", {
  schema: z.object({ orderId: z.string() })
});

export async function sendOrderConfirmed(orderId: string) {
  await inngest.send(orderConfirmedEvent.create({ orderId }));
}
