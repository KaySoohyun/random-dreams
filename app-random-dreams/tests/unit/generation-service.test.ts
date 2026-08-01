import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    generatedResult: { findUnique: vi.fn(), update: vi.fn() },
    generationLog: { create: vi.fn() }
  }
}));

import { prisma } from "@/lib/db/prisma";
import {
  getResultFile,
  logStep,
  markCompleted,
  markError,
  retryGeneration,
  saveImage,
  saveText,
  setProcessing
} from "@/lib/services/generation";

describe("generation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setProcessing marca PROCESSING y respeta un startedAt ya existente", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      startedAt: new Date("2026-01-01")
    } as never);
    vi.mocked(prisma.generatedResult.update).mockResolvedValue({} as never);

    await setProcessing("ord_1");
    expect(prisma.generatedResult.update).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
      data: { aiResponseStatus: "PROCESSING", startedAt: new Date("2026-01-01") }
    });
  });

  it("setProcessing devuelve null si el resultado no existe", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue(null);
    const result = await setProcessing("ord_1");
    expect(result).toBeNull();
    expect(prisma.generatedResult.update).not.toHaveBeenCalled();
  });

  it("saveImage persiste la imagen y deriva la extensión de los bytes", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    await saveImage("ord_1", new Uint8Array(png));
    const data = vi.mocked(prisma.generatedResult.update).mock.calls[0][0].data;
    expect(data.imageFileName).toBe("resultado.png");
    expect(Array.from(data.imageBytes as Uint8Array)).toEqual([...png]);
  });

  it("saveText persiste el texto y preserva la imagen existente", async () => {
    await saveText("ord_1", "hola");
    const data = vi.mocked(prisma.generatedResult.update).mock.calls[0][0].data;
    expect(data.textContent).toBe("hola");
    expect(data.textFileName).toBe("resultado.txt");
    expect(data.imageFileName).toBeUndefined();
    expect(data.imageBytes).toBeUndefined();
    expect(data.imageFileUrl).toBeUndefined();
  });

  it("markCompleted y markError transicionan el estado", async () => {
    await markCompleted("ord_1");
    expect(prisma.generatedResult.update).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
      data: { aiResponseStatus: "COMPLETED", completedAt: expect.any(Date) }
    });

    await markError("ord_1", "boom");
    expect(prisma.generatedResult.update).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
      data: { aiResponseStatus: "ERROR", error: "boom" }
    });
  });

  it("logStep crea un GenerationLog con step, status, payload y error", async () => {
    await logStep("ord_1", "GENERATE_TEXT", "FAILED", { error: "x", durationMs: 10 });
    expect(prisma.generationLog.create).toHaveBeenCalledWith({
      data: { orderId: "ord_1", step: "GENERATE_TEXT", status: "FAILED", payload: undefined, error: "x", durationMs: 10 }
    });
  });

  it("retryGeneration resetea a QUEUED e incrementa retryCount solo desde ERROR", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      aiResponseStatus: "ERROR"
    } as never);
    vi.mocked(prisma.generatedResult.update).mockResolvedValue({} as never);

    const result = await retryGeneration("ord_1");
    expect(result).not.toBeNull();
    expect(prisma.generatedResult.update).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
      data: {
        aiResponseStatus: "QUEUED",
        error: null,
        startedAt: null,
        completedAt: null,
        textFileName: null,
        textContent: null,
        textFileUrl: null,
        imageFileName: null,
        imageBytes: null,
        imageFileUrl: null,
        retryCount: { increment: 1 }
      }
    });
  });

  it("retryGeneration no-op desde COMPLETED o si el resultado no existe", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      aiResponseStatus: "COMPLETED"
    } as never);
    expect(await retryGeneration("ord_1")).toBeNull();
    expect(prisma.generatedResult.update).not.toHaveBeenCalled();

    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue(null);
    expect(await retryGeneration("ord_1")).toBeNull();
    expect(prisma.generatedResult.update).not.toHaveBeenCalled();
  });

  it("getResultFile devuelve el texto con content-type text/plain", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      textFileName: "resultado.txt",
      textContent: "hola"
    } as never);

    const file = await getResultFile("ord_1", "texto");
    expect(file.found).toBe(true);
    expect(file.fileName).toBe("resultado.txt");
    expect(file.contentType).toBe("text/plain; charset=utf-8");
    expect(new TextDecoder().decode(file.bytes)).toBe("hola");
  });

  it("getResultFile devuelve la imagen con content-type según sus bytes", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      imageFileName: "resultado.png",
      imageBytes: png
    } as never);

    const file = await getResultFile("ord_1", "imagen");
    expect(file.found).toBe(true);
    expect(file.fileName).toBe("resultado.png");
    expect(file.contentType).toBe("image/png");
    expect(Array.from(file.bytes as Uint8Array)).toEqual([...png]);

    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      imageFileName: "resultado.jpg",
      imageBytes: jpg
    } as never);
    expect((await getResultFile("ord_1", "imagen")).contentType).toBe("image/jpeg");
  });

  it("getResultFile devuelve found false si no existe el resultado o faltan bytes", async () => {
    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue(null);
    expect(await getResultFile("ord_1", "texto")).toEqual({ found: false });

    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      textFileName: "resultado.txt",
      textContent: null
    } as never);
    expect(await getResultFile("ord_1", "texto")).toEqual({ found: false });

    vi.mocked(prisma.generatedResult.findUnique).mockResolvedValue({
      orderId: "ord_1",
      imageFileName: null,
      imageBytes: null
    } as never);
    expect(await getResultFile("ord_1", "imagen")).toEqual({ found: false });
  });
});
