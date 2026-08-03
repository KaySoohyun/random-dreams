import { runGenerationInline } from "./pipeline";

export function enqueueGeneration(orderId: string) {
  Promise.resolve(runGenerationInline(orderId)).catch((error) => {
    console.error("Error al generar en background:", error);
  });
}
