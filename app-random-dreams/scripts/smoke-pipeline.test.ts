import { expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { confirmOrder, createPendingOrder } from "@/lib/services/orders";
import { getResultFile, retryGeneration } from "@/lib/services/generation";
import { runGenerationPipeline } from "@/inngest/run-pipeline";

const fakeRun: (id: string, fn: () => Promise<unknown>) => Promise<unknown> = async (_id, fn) =>
  fn();

it("smoke: pipeline IA end-to-end (mock o real según AI_MOCK)", async () => {
  console.log(
    `Modo: ${process.env.AI_MOCK === "true" ? "AI_MOCK (sin llamadas reales)" : "proveedores REALES (Gemini + Hugging Face)"}`
  );

  const product = await prisma.product.findFirst({ orderBy: { createdAt: "asc" } });
  if (!product) throw new Error("No hay productos en la BD");

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

    const before = await prisma.generationLog.count({ where: { orderId: order.id } });
    await runGenerationPipeline(order.id, fakeRun);

    const result = await prisma.generatedResult.findUnique({ where: { orderId: order.id } });
    if (!result) throw new Error("No se creó GeneratedResult");

    expect(result.aiResponseStatus).toBe("COMPLETED");
    expect(result.textContent).toBeTruthy();
    expect(result.imageBytes?.length).toBeGreaterThan(0);
    if (process.env.AI_MOCK === "true") {
      expect(result.textContent).toContain("[mock]");
    } else {
      expect(result.textContent!.length).toBeGreaterThan(40);
      expect(result.imageBytes!.length).toBeGreaterThan(1000);
    }
    expect(result.textFileName).toBe("resultado.txt");
    const expectedExt = process.env.AI_MOCK === "true" ? "png" : "jpg";
    expect(result.imageFileName).toBe(`resultado.${expectedExt}`);
    console.log("textContent:", result.textContent.slice(0, 120), "…");
    console.log("imageBytes:", result.imageBytes?.length, "bytes");

    const after = await prisma.generationLog.count({ where: { orderId: order.id } });
    expect(after - before).toBe(8);

    const textFile = await getResultFile(order.id, "texto");
    expect(textFile.found).toBe(true);
    expect(textFile.fileName).toBe("resultado.txt");
    expect(textFile.contentType).toBe("text/plain; charset=utf-8");
    expect(textFile.bytes?.length).toBe(new TextEncoder().encode(result.textContent as string).length);

    const imageFile = await getResultFile(order.id, "imagen");
    expect(imageFile.found).toBe(true);
    expect(imageFile.contentType).toBe(process.env.AI_MOCK === "true" ? "image/png" : "image/jpeg");
    expect(imageFile.bytes?.length).toBe(result.imageBytes?.length);
    console.log("archivo texto:", textFile.fileName, "| imagen:", imageFile.fileName);

    expect(await retryGeneration(order.id)).toBeNull();
  } finally {
    await prisma.generationLog.deleteMany({ where: { orderId: order.id } });
    await prisma.generatedResult.deleteMany({ where: { orderId: order.id } });
    await prisma.formSubmission.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
});
