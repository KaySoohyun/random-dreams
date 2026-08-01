import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }
}));

vi.mock("@/lib/services/generation", () => ({
  retryGeneration: vi.fn()
}));

vi.mock("@/trigger/pipeline", () => ({
  runImageGenerationInline: vi.fn()
}));

vi.mock("@/trigger/events", () => ({
  enqueueGeneration: vi.fn().mockResolvedValue(undefined)
}));

import { generateImageAction, retryGenerationAction } from "@/features/result/actions";
import { retryGeneration } from "@/lib/services/generation";
import { runImageGenerationInline } from "@/trigger/pipeline";
import { enqueueGeneration } from "@/trigger/events";

function catchResult(fn: () => Promise<unknown>): { ok: true } | { ok: false; message: string } {
  return fn().then(
    () => ({ ok: true }) as const,
    (error) =>
      ({
        ok: false,
        message: error instanceof Error ? error.message : String(error)
      }) as const
  );
}

describe("retryGenerationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reintenta, encola y redirige a /generacion si hay un resultado con error", async () => {
    vi.mocked(retryGeneration).mockResolvedValue({ id: "r1" } as never);

    const result = await catchResult(() => retryGenerationAction("ord_1", new FormData()));

    expect(result).toEqual({ ok: false, message: "REDIRECT:/generacion/ord_1" });
    expect(retryGeneration).toHaveBeenCalledWith("ord_1");
    expect(enqueueGeneration).toHaveBeenCalledWith("ord_1");
  });

  it("redirige sin encolar si no hay nada que reintentar", async () => {
    vi.mocked(retryGeneration).mockResolvedValue(null);

    const result = await catchResult(() => retryGenerationAction("ord_1", new FormData()));

    expect(result).toEqual({ ok: false, message: "REDIRECT:/generacion/ord_1" });
    expect(enqueueGeneration).not.toHaveBeenCalled();
  });
});

describe("generateImageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genera la imagen en línea y redirige", async () => {
    vi.mocked(runImageGenerationInline).mockResolvedValue(undefined as never);

    const result = await catchResult(() => generateImageAction("ord_1", undefined, new FormData()));

    expect(result).toEqual({ ok: false, message: "REDIRECT:/generacion/ord_1" });
    expect(runImageGenerationInline).toHaveBeenCalledWith("ord_1");
  });

  it("devuelve el error sin redirigir si la generación falla", async () => {
    vi.mocked(runImageGenerationInline).mockRejectedValue(new Error("imagen boom"));

    const result = await generateImageAction("ord_1", undefined, new FormData());

    expect(result).toEqual({ error: "imagen boom" });
  });

  it("convierte errores no-Error a string", async () => {
    vi.mocked(runImageGenerationInline).mockRejectedValue("algo salió mal");

    const result = await generateImageAction("ord_1", undefined, new FormData());

    expect(result).toEqual({ error: "algo salió mal" });
  });
});
