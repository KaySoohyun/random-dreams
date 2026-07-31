"use server";

import { redirect } from "next/navigation";
import { retryGeneration } from "@/lib/services/generation";
import { sendOrderConfirmed } from "@/inngest/events";

export async function retryGenerationAction(orderId: string, _formData: FormData) {
  const result = await retryGeneration(orderId);
  if (result) {
    try {
      await sendOrderConfirmed(orderId);
    } catch (error) {
      console.warn("No se pudo enviar el evento order/confirmed al reintentar:", error);
    }
  }

  redirect(`/generacion/${orderId}`);
}
