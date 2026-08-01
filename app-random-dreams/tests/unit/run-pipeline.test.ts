import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/generation", () => ({
  getOrderForGeneration: vi.fn(),
  logStep: vi.fn().mockResolvedValue({}),
  markCompleted: vi.fn().mockResolvedValue({}),
  saveText: vi.fn().mockResolvedValue({}),
  setProcessing: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/ai/factory", () => ({
  getContentProvider: vi.fn()
}));

import * as aiFactory from "@/lib/ai/factory";
import * as generationService from "@/lib/services/generation";
import { runGenerationPipeline } from "@/inngest/run-pipeline";

const run = async (_id: string, fn: () => Promise<unknown>): Promise<unknown> => fn();

function orderWith(status: string) {
  return {
    id: "ord_1",
    product: { id: "p1", aiTextTemplate: "Hola {nombre}", aiPromptTemplate: "Retrato {nombre}" },
    formSubmission: { formData: { nombre: "Martín" } },
    generatedResult: { aiResponseStatus: status }
  };
}

describe("runGenerationPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiFactory.getContentProvider).mockReturnValue({
      generate: vi.fn().mockResolvedValue({ text: "texto", imagePrompt: "prompt" })
    } as never);
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(
      orderWith("QUEUED") as never
    );
  });

  it("ejecuta los 3 pasos y registra logs RUNNING/SUCCESS", async () => {
    await runGenerationPipeline("ord_1", run);

    expect(generationService.getOrderForGeneration).toHaveBeenCalledWith("ord_1");
    expect(generationService.setProcessing).toHaveBeenCalledWith("ord_1");
    expect(aiFactory.getContentProvider).toHaveBeenCalledTimes(1);
    expect(generationService.saveText).toHaveBeenCalledWith("ord_1", "texto");
    expect(generationService.markCompleted).toHaveBeenCalledWith("ord_1");

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    const steps = logCalls.map((call) => `${call[1]}:${call[2]}`);
    for (const step of ["GENERATE_TEXT", "UPLOAD_RESULT", "MARK_COMPLETED"]) {
      expect(steps).toContain(`${step}:RUNNING`);
      expect(steps).toContain(`${step}:SUCCESS`);
    }
  });

  it("sale temprano si el resultado ya está COMPLETED", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(
      orderWith("COMPLETED") as never
    );
    await runGenerationPipeline("ord_1", run);

    expect(generationService.setProcessing).not.toHaveBeenCalled();
    expect(aiFactory.getContentProvider).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });

  it("no hace nada si la orden o el resultado no existen", async () => {
    vi.mocked(generationService.getOrderForGeneration).mockResolvedValue(null as never);
    await runGenerationPipeline("ord_1", run);

    expect(generationService.setProcessing).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });

  it("ante un fallo del proveedor registra FAILED y propaga el error", async () => {
    vi.mocked(aiFactory.getContentProvider).mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("boom"))
    } as never);

    await expect(runGenerationPipeline("ord_1", run)).rejects.toThrow("boom");

    const logCalls = vi.mocked(generationService.logStep).mock.calls;
    expect(logCalls.some((call) => call[1] === "GENERATE_TEXT" && call[2] === "FAILED")).toBe(true);
    expect(generationService.saveText).not.toHaveBeenCalled();
    expect(generationService.markCompleted).not.toHaveBeenCalled();
  });
});
