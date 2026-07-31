"use server";

import { notFound, redirect } from "next/navigation";
import { confirmOrder } from "@/lib/services/orders";
import { sendOrderConfirmed } from "@/inngest/events";

export async function confirmOrderAction(orderId: string, formData: FormData) {
  const result = await confirmOrder(orderId);
  if (!result.order) notFound();

  if (result.transitioned) {
    try {
      await sendOrderConfirmed(orderId);
    } catch (error) {
      console.warn(
        "No se pudo enviar el evento order/confirmed (el pipeline se puede reintentar en 005):",
        error
      );
    }
  }

  redirect(`/generacion/${result.order.id}`);
}
