"use server";

import { notFound, redirect } from "next/navigation";
import { confirmOrder } from "@/lib/services/orders";
import { runGenerationInline } from "@/trigger/pipeline";
import { sendOrderConfirmed } from "@/trigger/events";

export async function confirmOrderAction(orderId: string, formData: FormData) {
  const result = await confirmOrder(orderId);
  if (!result.order) notFound();

  if (result.transitioned) {
    try {
      await sendOrderConfirmed(orderId);
    } catch (error) {
      console.warn("No se pudo encolar en Trigger.dev; se genera en línea:", error);
      await runGenerationInline(orderId);
    }
  }

  redirect(`/generacion/${result.order.id}`);
}
