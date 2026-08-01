"use server";

import { redirect } from "next/navigation";
import { retryGeneration } from "@/lib/services/generation";
import { runGenerationInline, runImageGenerationInline } from "@/inngest/run-with-errors";

export async function retryGenerationAction(orderId: string, _formData: FormData) {
  const result = await retryGeneration(orderId);
  if (result) {
    await runGenerationInline(orderId);
  }

  redirect(`/generacion/${orderId}`);
}

export async function generateImageAction(
  orderId: string,
  _prev: { error?: string } | undefined,
  _formData: FormData
): Promise<{ error?: string }> {
  try {
    await runImageGenerationInline(orderId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  redirect(`/generacion/${orderId}`);
}
