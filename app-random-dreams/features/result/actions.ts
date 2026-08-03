"use server";

import { redirect } from "next/navigation";
import { retryGeneration } from "@/lib/services/generation";
import { enqueueGeneration } from "@/trigger/events";

export async function retryGenerationAction(
  orderId: string,
  _prev: { error?: string } | undefined,
  _formData: FormData
): Promise<{ error?: string }> {
  try {
    const result = await retryGeneration(orderId);
    if (result) {
      await enqueueGeneration(orderId);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  redirect(`/generacion/${orderId}`);
}
