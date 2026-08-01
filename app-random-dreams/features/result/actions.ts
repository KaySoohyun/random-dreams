"use server";

import { redirect } from "next/navigation";
import { retryGeneration } from "@/lib/services/generation";
import { runGenerationInline } from "@/inngest/run-with-errors";

export async function retryGenerationAction(orderId: string, _formData: FormData) {
  const result = await retryGeneration(orderId);
  if (result) {
    await runGenerationInline(orderId);
  }

  redirect(`/generacion/${orderId}`);
}
