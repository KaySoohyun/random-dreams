"use server";

import { notFound, redirect } from "next/navigation";
import { confirmOrder } from "@/lib/services/orders";
import { enqueueGeneration } from "@/trigger/events";

export async function confirmOrderAction(orderId: string, _formData: FormData) {
  const result = await confirmOrder(orderId);
  if (!result.order) notFound();

  if (result.transitioned) {
    await enqueueGeneration(orderId);
  }

  redirect(`/generacion/${result.order.id}`);
}
