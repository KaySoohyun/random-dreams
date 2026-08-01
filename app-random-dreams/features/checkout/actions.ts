"use server";

import { notFound, redirect } from "next/navigation";
import { confirmOrder } from "@/lib/services/orders";
import { runGenerationInline } from "@/inngest/run-with-errors";

export async function confirmOrderAction(orderId: string, formData: FormData) {
  const result = await confirmOrder(orderId);
  if (!result.order) notFound();

  if (result.transitioned) {
    await runGenerationInline(orderId);
  }

  redirect(`/generacion/${result.order.id}`);
}
