import { beforeEach, describe, expect, it } from "vitest";
import {
  createOrderInStore,
  getOrderForGenerationInStore,
  getLogsForOrder,
  resetStoreForTests,
  setResultStatus
} from "@/lib/store/orders";
import {
  buildResultFileName,
  getResultFile,
  getResultFileName,
  logStep,
  markCompleted,
  markError,
  retryGeneration,
  saveImage,
  saveText,
  setProcessing
} from "@/lib/services/generation";

const PRODUCT_ID = "criatura-fantastica";

function seedOrder() {
  return createOrderInStore({
    productId: PRODUCT_ID,
    formData: { nombre_criatura: "Fénix" }
  });
}

describe("generation service", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("setProcessing marca PROCESSING y respeta un startedAt ya existente", () => {
    const { id } = seedOrder();
    setResultStatus(id, { aiResponseStatus: "QUEUED", startedAt: new Date("2026-01-01") });

    setProcessing(id);
    const result = getOrderForGenerationInStore(id)?.generatedResult;
    expect(result?.aiResponseStatus).toBe("PROCESSING");
    expect(result?.startedAt?.toISOString()).toBe(new Date("2026-01-01").toISOString());
  });

  it("setProcessing devuelve null si el resultado no existe", () => {
    const { id } = seedOrder();
    const result = setProcessing(id);
    expect(result).toBeNull();
    expect(getOrderForGenerationInStore(id)?.generatedResult).toBeNull();
  });

  it("saveImage persiste la imagen y deriva la extensión de los bytes", () => {
    const { id } = seedOrder();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    saveImage(id, new Uint8Array(png));
    const result = getOrderForGenerationInStore(id)?.generatedResult;
    expect(Array.from(result?.imageBytes ?? [])).toEqual([...png]);
  });

  it("saveText persiste el texto y preserva la imagen existente", () => {
    const { id } = seedOrder();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    saveImage(id, new Uint8Array(png));

    saveText(id, "hola");
    const result = getOrderForGenerationInStore(id)?.generatedResult;
    expect(result?.textContent).toBe("hola");
    expect(result?.imageBytes).not.toBeNull();
  });

  it("markCompleted y markError transicionan el estado", () => {
    const { id } = seedOrder();
    setResultStatus(id, { aiResponseStatus: "QUEUED" });

    markCompleted(id);
    expect(getOrderForGenerationInStore(id)?.generatedResult?.aiResponseStatus).toBe("COMPLETED");
    expect(getOrderForGenerationInStore(id)?.generatedResult?.completedAt).toBeInstanceOf(Date);

    markError(id, "boom");
    expect(getOrderForGenerationInStore(id)?.generatedResult?.aiResponseStatus).toBe("ERROR");
    expect(getOrderForGenerationInStore(id)?.generatedResult?.error).toBe("boom");
  });

  it("logStep crea un GenerationLog con step, status y error", () => {
    const { id } = seedOrder();
    logStep(id, "GENERATE_TEXT", "FAILED", { error: "x", durationMs: 10 });
    logStep(id, "GENERATE_TEXT", "SUCCESS", { durationMs: 5 });

    const logs = getLogsForOrder(id);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ step: "GENERATE_TEXT", status: "FAILED", error: "x", durationMs: 10 });
    expect(logs[1]).toMatchObject({ step: "GENERATE_TEXT", status: "SUCCESS", error: null, durationMs: 5 });
  });

  it("retryGeneration resetea a QUEUED e incrementa retryCount solo desde ERROR", async () => {
    const { id } = seedOrder();
    setResultStatus(id, { aiResponseStatus: "ERROR", error: "boom", textContent: null });

    saveText(id, "texto viejo");
    const result = await retryGeneration(id);
    expect(result).not.toBeNull();
    const stored = getOrderForGenerationInStore(id)?.generatedResult;
    expect(stored?.aiResponseStatus).toBe("QUEUED");
    expect(stored?.error).toBeNull();
    expect(stored?.textContent).toBeNull();
    expect(stored?.imageBytes).toBeNull();
    expect(stored?.retryCount).toBe(1);
  });

  it("retryGeneration no-op desde COMPLETED o si el resultado no existe", async () => {
    const { id } = seedOrder();
    setResultStatus(id, { aiResponseStatus: "COMPLETED" });
    await expect(retryGeneration(id)).resolves.toBeNull();

    const other = seedOrder();
    await expect(retryGeneration(other.id)).resolves.toBeNull();
  });

  it("getResultFile devuelve el texto con nombre derivado y content-type text/plain", () => {
    const { id } = seedOrder();
    saveText(id, "hola");

    const file = getResultFile(id, "texto");
    expect(file.found).toBe(true);
    expect(file.fileName).toMatch(/^criatura-fantastica-fenix-\d{4}-\d{2}-\d{2}\.txt$/);
    expect(file.contentType).toBe("text/plain; charset=utf-8");
    expect(new TextDecoder().decode(file.bytes)).toBe("hola");
  });

  it("getResultFile devuelve la imagen con nombre derivado y content-type según sus bytes", () => {
    const { id } = seedOrder();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    saveImage(id, new Uint8Array(png));

    const file = getResultFile(id, "imagen");
    expect(file.found).toBe(true);
    expect(file.fileName).toMatch(/^criatura-fantastica-fenix-\d{4}-\d{2}-\d{2}\.png$/);
    expect(file.contentType).toBe("image/png");
    expect(Array.from(file.bytes as Uint8Array)).toEqual([...png]);

    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    saveImage(id, new Uint8Array(jpg));
    expect(getResultFile(id, "imagen").fileName).toMatch(
      /^criatura-fantastica-fenix-\d{4}-\d{2}-\d{2}\.jpg$/
    );
    expect(getResultFile(id, "imagen").contentType).toBe("image/jpeg");
  });

  it("getResultFile devuelve found false si no existe el resultado o faltan bytes", () => {
    expect(getResultFile("ord_404", "texto")).toEqual({ found: false });

    const { id } = seedOrder();
    expect(getResultFile(id, "texto")).toEqual({ found: false });
    expect(getResultFile(id, "imagen")).toEqual({ found: false });
  });
});

describe("buildResultFileName", () => {
  it("arma <slug>-<nombre>-<fecha>.<ext> con nombre slugificado", () => {
    const name = buildResultFileName({
      slug: "souvenir-de-vida-paralela",
      nameValue: "Martín García",
      extension: "txt",
      date: new Date(2026, 7, 3)
    });
    expect(name).toBe("souvenir-de-vida-paralela-martin-garcia-2026-08-03.txt");
  });

  it("quita acentos y caracteres no alfanuméricos", () => {
    const name = buildResultFileName({
      slug: "identidad-secreta-de-epoca",
      nameValue: "¡Fénix del Pantano!",
      extension: "png",
      date: new Date(2026, 0, 5)
    });
    expect(name).toBe("identidad-secreta-de-epoca-fenix-del-pantano-2026-01-05.png");
  });

  it("sin nombre usa solo <slug>-<fecha>.<ext> (productos sin campo text)", () => {
    const name = buildResultFileName({
      slug: "formula-de-emociones",
      nameValue: null,
      extension: "txt",
      date: new Date(2026, 1, 28)
    });
    expect(name).toBe("formula-de-emociones-2026-02-28.txt");
  });

  it("usa la fecha actual por defecto", () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const name = buildResultFileName({
      slug: "criatura-fantastica",
      nameValue: "Loki",
      extension: "txt"
    });
    expect(name).toBe(`criatura-fantastica-loki-${expected}.txt`);
  });
});

describe("getResultFileName", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("deriva el nombre del primer campo text del formSchema y el formData", () => {
    const { id } = createOrderInStore({
      productId: "criatura-fantastica",
      formData: { nombre_criatura: "Fénix" }
    });

    const name = getResultFileName(id, "txt", new Date(2026, 2, 1));
    expect(name).toBe("criatura-fantastica-fenix-2026-03-01.txt");
  });

  it("ignora el primer campo si no es text (usa solo slug)", () => {
    const { id } = createOrderInStore({
      productId: "formula-de-emociones",
      formData: { anio: 1998 }
    });

    const name = getResultFileName(id, "pdf", new Date(2026, 2, 1));
    expect(name).toBe("formula-de-emociones-2026-03-01.pdf");
  });

  it("devuelve null si el pedido no existe", () => {
    expect(getResultFileName("ord_404", "txt")).toBeNull();
  });
});
