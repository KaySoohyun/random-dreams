import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/generation", () => ({
  getOrderForGeneration: vi.fn(),
  logStep: vi.fn().mockResolvedValue({}),
  markCompleted: vi.fn().mockResolvedValue({}),
  markError: vi.fn().mockResolvedValue({}),
  saveImage: vi.fn().mockResolvedValue({}),
  saveText: vi.fn().mockResolvedValue({}),
  setProcessing: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/ai/factory", () => ({
  getContentProvider: vi.fn(),
  getImageProvider: vi.fn()
}));

const triggerMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "run_1" }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock }
}));

vi.mock("@/trigger/pipeline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/trigger/pipeline")>();
  return { ...actual, runGenerationInline: vi.fn() };
});

import * as aiFactory from "@/lib/ai/factory";
import * as generationService from "@/lib/services/generation";
import { runGenerationPipeline, runImageGenerationInline } from "@/trigger/pipeline";
import { runGenerationInline } from "@/trigger/pipeline";
import { enqueueGeneration } from "@/trigger/events";

function orderWith(status: string) {
  return {
    id: "ord_1",
    product: { id: "p1", aiTextTemplate: "Hola {nombre}", aiPromptTemplate: "Retrato {nombre}" },
    formSubmission: { formData: { nombre: "Martín" } },
    generatedResult: { aiResponseStatus: status, imageBytes: null }
  };
}

describe("runGenerationPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiFactory.getContentProvider).mockReturnValue({
      generate: vi.fn().mockResolvedValue({ text: "texto", imagePrompt: "prompt" })
    } as never);
    vi.mocked(aiFactory.getImageProvider).mockReturnValue({
      generate: vi.fn().mockResolvedValue(Buffer.from([1, 2, 3]))
    } as never);
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(
      orderWith("QUEUED") as never
    );
  });

  it("ejecuta los 4 pasos (texto + imagen) y registra logs RUNNING/SUCCESS", async () => {
    await runGenerationPipeline("ord_1");

    expect(generationService.getOrderForGeneration).toHaveBeenCalledWith("ord_1");
    expect(generationService.setProcessing).toHaveBeenCalledWith("ord_1");
    expect(aiFactory.getContentProvider).toHaveBeenCalledTimes(1);
    expect(aiFactory.getImageProvider).toHaveBeenCalledTimes(1);
    expect(aiFactory.getImageProvider().generate).toHaveBeenCalledWith("Retrato Martín");
    expect(generationService.saveText).toHaveBeenCalledWith("ord_1", "texto");
    expect(generationService.saveImage).toHaveBeenCalledWith("ord_1", new Uint8Array([1, 2, 3]));
    expect(generationService.markCompleted).toHaveBeenCalledWith("ord_1");

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    const steps = logCalls.map((call) => `${call[1]}:${call[2]}`);
    for (const step of ["GENERATE_TEXT", "UPLOAD_RESULT", "GENERATE_IMAGE", "MARK_COMPLETED"]) {
      expect(steps).toContain(`${step}:RUNNING`);
      expect(steps).toContain(`${step}:SUCCESS`);
    }
  });

  it("no genera imagen si la imagen ya existe", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue({
      id: "ord_1",
      product: { id: "p1", aiTextTemplate: "Hola {nombre}", aiPromptTemplate: "Retrato {nombre}" },
      formSubmission: { formData: { nombre: "Martín" } },
      generatedResult: { aiResponseStatus: "QUEUED", imageBytes: new Uint8Array([1, 2, 3]) }
    } as never);

    await runGenerationPipeline("ord_1");

    expect(aiFactory.getImageProvider).not.toHaveBeenCalled();
    expect(generationService.saveImage).not.toHaveBeenCalled();
    expect(generationService.markCompleted).toHaveBeenCalledWith("ord_1");
  });

  it("si la imagen falla, completa con el texto y loguea FAILED sin propagar", async () => {
    vi.mocked(aiFactory.getImageProvider).mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("imagen boom"))
    } as never);

    await expect(runGenerationPipeline("ord_1")).resolves.toBeUndefined();

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    expect(
      logCalls.some((call) => call[1] === "GENERATE_IMAGE" && call[2] === "FAILED")
    ).toBe(true);
    expect(generationService.markCompleted).toHaveBeenCalledWith("ord_1");
  });

  it("sale temprano si el resultado ya está COMPLETED", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(
      orderWith("COMPLETED") as never
    );
    await runGenerationPipeline("ord_1");

    expect(generationService.setProcessing).not.toHaveBeenCalled();
    expect(aiFactory.getContentProvider).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });

  it("no hace nada si la orden o el resultado no existen", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(null as never);
    await runGenerationPipeline("ord_1");

    expect(generationService.setProcessing).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });

  it("ante un fallo del proveedor registra FAILED y propaga el error", async () => {
    vi.mocked(aiFactory.getContentProvider).mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("boom"))
    } as never);

    await expect(runGenerationPipeline("ord_1")).rejects.toThrow("boom");

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    expect(logCalls.some((call) => call[1] === "GENERATE_TEXT" && call[2] === "FAILED")).toBe(true);
    expect(generationService.saveText).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });
});

describe("runImageGenerationInline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiFactory.getImageProvider).mockReturnValue({
      generate: vi.fn().mockResolvedValue(Buffer.from([1, 2, 3]))
    } as never);
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(
      orderWith("COMPLETED") as never
    );
  });

  it("interpola el prompt de imagen, la genera y guarda con logs RUNNING/SUCCESS", async () => {
    await runImageGenerationInline("ord_1");

    expect(generationService.getOrderForGeneration).toHaveBeenCalledWith("ord_1");
    expect(aiFactory.getImageProvider).toHaveBeenCalledTimes(1);
    expect(aiFactory.getImageProvider().generate).toHaveBeenCalledWith("Retrato Martín");
    expect(generationService.saveImage).toHaveBeenCalledWith(
      "ord_1",
      new Uint8Array([1, 2, 3])
    );

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    expect(logCalls.some((call) => call[1] === "GENERATE_IMAGE" && call[2] === "RUNNING")).toBe(true);
    expect(logCalls.some((call) => call[1] === "GENERATE_IMAGE" && call[2] === "SUCCESS")).toBe(true);
  });

  it("no regenera la imagen si ya existe", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue({
      id: "ord_1",
      product: { id: "p1", aiPromptTemplate: "Retrato {nombre}" },
      formSubmission: { formData: { nombre: "Martín" } },
      generatedResult: { imageBytes: new Uint8Array([1, 2, 3]) }
    } as never);

    await runImageGenerationInline("ord_1");

    expect(aiFactory.getImageProvider).not.toHaveBeenCalled();
    expect(generationService.saveImage).not.toHaveBeenCalled();
  });

  it("registra FAILED y propaga el error si el proveedor falla", async () => {
    vi.mocked(aiFactory.getImageProvider).mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("boom"))
    } as never);

    await expect(runImageGenerationInline("ord_1")).rejects.toThrow("boom");

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    expect(logCalls.some((call) => call[1] === "GENERATE_IMAGE" && call[2] === "FAILED")).toBe(true);
    expect(generationService.saveImage).not.toHaveBeenCalled();
  });
});

describe("enqueueGeneration", () => {
  it("encola la generación y no cae a inline si Trigger.dev está disponible", async () => {
    vi.clearAllMocks();
    await enqueueGeneration("ord_1");
    expect(triggerMock).toHaveBeenCalledWith("generate-dream", { orderId: "ord_1" });
    expect(runGenerationInline).not.toHaveBeenCalled();
  });

  it("cae a la generación inline si Trigger.dev no está disponible", async () => {
    vi.clearAllMocks();
    triggerMock.mockRejectedValueOnce(new Error("no config"));
    await enqueueGeneration("ord_1");
    expect(runGenerationInline).toHaveBeenCalledWith("ord_1");
  });
});
