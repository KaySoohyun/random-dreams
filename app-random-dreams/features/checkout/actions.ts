"use server";

import { notFound, redirect } from "next/navigation";
import { confirmOrder } from "@/lib/services/orders";
import { enqueueGeneration } from "@/trigger/events";

export async function confirmOrderAction(
  orderId: string,
  _prev: { error?: string } | undefined,
  _formData: FormData
): Promise<{ error?: string }> {
  let result: Awaited<ReturnType<typeof confirmOrder>>;
  try {
    result = await confirmOrder(orderId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  if (!result.order) notFound();

  if (result.transitioned) {
    try {
      await enqueueGeneration(orderId);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  redirect(`/generacion/${result.order.id}`);
}
