import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }
}));

vi.mock("@/lib/services/orders", () => ({
  confirmOrder: vi.fn()
}));

vi.mock("@/trigger/events", () => ({
  enqueueGeneration: vi.fn().mockResolvedValue(undefined)
}));

import { confirmOrderAction } from "@/features/checkout/actions";
import { confirmOrder } from "@/lib/services/orders";
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

describe("confirmOrderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notFound si la orden no existe", async () => {
    vi.mocked(confirmOrder).mockResolvedValue({ order: null, transitioned: false } as never);

    const result = await catchResult(() => confirmOrderAction("ord_404", new FormData()));

    expect(result).toEqual({ ok: false, message: "NOT_FOUND" });
    expect(enqueueGeneration).not.toHaveBeenCalled();
  });

  it("encola la generación y redirige a /generacion al confirmar por primera vez", async () => {
    vi.mocked(confirmOrder).mockResolvedValue({
      order: { id: "ord_1" },
      transitioned: true
    } as never);

    const result = await catchResult(() => confirmOrderAction("ord_1", new FormData()));

    expect(result).toEqual({ ok: false, message: "REDIRECT:/generacion/ord_1" });
    expect(enqueueGeneration).toHaveBeenCalledWith("ord_1");
  });

  it("no encola si la orden ya estaba confirmada (transición false)", async () => {
    vi.mocked(confirmOrder).mockResolvedValue({
      order: { id: "ord_1" },
      transitioned: false
    } as never);

    const result = await catchResult(() => confirmOrderAction("ord_1", new FormData()));

    expect(result).toEqual({ ok: false, message: "REDIRECT:/generacion/ord_1" });
    expect(enqueueGeneration).not.toHaveBeenCalled();
  });
});
