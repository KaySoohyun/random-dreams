import { expect, it } from "vitest";
import { products } from "@/lib/data/products";
import { confirmOrder, createPendingOrder } from "@/lib/services/orders";
import {
  getResultFile,
  retryGeneration
} from "@/lib/services/generation";
import { getLogsForOrder } from "@/lib/store/orders";
import { runGenerationPipeline } from "@/trigger/pipeline";

it("smoke: pipeline IA end-to-end (mock o real según AI_MOCK)", async () => {
  console.log(
    `Modo: ${process.env.AI_MOCK === "true" ? "AI_MOCK (sin llamadas reales)" : "proveedores REALES (Gemini + Hugging Face)"}`
  );

  const product = products[0];
  if (!product) throw new Error("No hay productos en el catálogo");

  const fields = (product.formSchema as { fields?: Array<Record<string, unknown>> }).fields ?? [];
  const formData: Record<string, unknown> = {};
  for (const field of fields) {
    const name = field.name as string;
    const type = field.type as string;
    if (type === "number") formData[name] = 5;
    else if (type === "multiselect") formData[name] = (field.options as string[]).slice(0, 2);
    else if (type === "select") formData[name] = (field.options as string[])[0];
    else formData[name] = "Prueba de smoke";
  }

  const order = await createPendingOrder({ productId: product.id, formData });

  try {
    const confirmed = await confirmOrder(order.id);
    if (!confirmed.order) throw new Error("confirmOrder devolvió order null");
    expect(confirmed.transitioned).toBe(true);

    const before = getLogsForOrder(order.id).length;
    await runGenerationPipeline(order.id);

    const result = order.id;
    const generatedResult = confirmed.order.generatedResult;
    if (!generatedResult) throw new Error("No se creó GeneratedResult");

    expect(generatedResult.aiResponseStatus).toBe("COMPLETED");
    expect(generatedResult.textContent).toBeTruthy();
    if (process.env.AI_MOCK === "true") {
      expect(generatedResult.textContent).toContain("[mock]");
    } else {
      expect(generatedResult.textContent!.length).toBeGreaterThan(40);
    }
    console.log("textContent:", generatedResult.textContent.slice(0, 120), "…");

    if (process.env.AI_MOCK === "true" && process.env.AI_IMAGE_OK !== "true") {
      expect(generatedResult.imageBytes).toBeNull();
      const imageFile = await getResultFile(result, "imagen");
      expect(imageFile.found).toBe(false);
      console.log("imagen: no generada (mock sin AI_IMAGE_OK — aviso en la página)");
    } else {
      expect(generatedResult.imageBytes?.length).toBeGreaterThan(0);
      if (process.env.AI_MOCK === "true") {
        expect(generatedResult.imageBytes!.length).toBeGreaterThan(0);
      } else {
        expect(generatedResult.imageBytes!.length).toBeGreaterThan(1000);
      }
    }

    const after = getLogsForOrder(result).length;
    expect(after - before).toBe(8);

    const textFile = await getResultFile(result, "texto");
    expect(textFile.found).toBe(true);
    expect(textFile.fileName).toMatch(/^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.txt$/);
    expect(textFile.contentType).toBe("text/plain; charset=utf-8");
    expect(textFile.bytes?.length).toBe(
      new TextEncoder().encode(generatedResult.textContent as string).length
    );

    if (process.env.AI_MOCK !== "true" || process.env.AI_IMAGE_OK === "true") {
      const imageFile = await getResultFile(result, "imagen");
      expect(imageFile.found).toBe(true);
      expect(imageFile.fileName).toMatch(/^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.(png|jpg)$/);
      expect(imageFile.contentType).toBe(
        process.env.AI_MOCK === "true" ? "image/png" : "image/jpeg"
      );
      console.log("archivo texto:", textFile.fileName, "| imagen:", imageFile.fileName);
    } else {
      console.log("archivo texto:", textFile.fileName);
    }

    expect(await retryGeneration(result)).toBeNull();
  } finally {
    // El store se limpia solo por TTL; no hay BD que limpiar.
  }
});
