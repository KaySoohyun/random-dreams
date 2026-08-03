import { describe, expect, it } from "vitest";
import { serializeForCookie, deserializeOrder } from "@/lib/store/order-cookie";
import type { StoredOrder } from "@/lib/store/orders";

function makeOrder(overrides: Partial<StoredOrder> = {}): StoredOrder {
  const now = new Date("2026-08-03T10:00:00.000Z");
  return {
    id: "ord_1",
    productId: "criatura-fantastica",
    paymentStatus: "APPROVED",
    confirmedAt: now,
    formData: { nombre: "Sofía" },
    createdAt: now,
    updatedAt: now,
    result: {
      aiResponseStatus: "COMPLETED",
      textContent: "Tu criatura…",
      imageBytes: new Uint8Array([1, 2, 3]),
      error: null,
      retryCount: 0,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now
    },
    ...overrides
  };
}

describe("order-cookie serialize/deserialize", () => {
  it("round-trip preserva el pedido sin imageBytes", () => {
    const json = serializeForCookie(makeOrder());
    const raw = JSON.parse(json) as Parameters<typeof deserializeOrder>[0];
    expect(raw.result?.imageBytes).toBeNull();
    const back = deserializeOrder(raw);
    expect(back.id).toBe("ord_1");
    expect(back.paymentStatus).toBe("APPROVED");
    expect(back.result?.aiResponseStatus).toBe("COMPLETED");
    expect(back.result?.textContent).toBe("Tu criatura…");
    expect(back.result?.imageBytes).toBeNull();
  });

  it("convierte las fechas de vuelta a Date (regresión del Application error)", () => {
    const json = serializeForCookie(makeOrder());
    const back = deserializeOrder(JSON.parse(json) as Parameters<typeof deserializeOrder>[0]);
    for (const field of ["createdAt", "updatedAt", "confirmedAt"] as const) {
      expect(back[field]).toBeInstanceOf(Date);
      expect(back[field]?.getTime()).not.toBeNaN();
    }
    for (const field of ["startedAt", "completedAt", "createdAt", "updatedAt"] as const) {
      expect(back.result?.[field]).toBeInstanceOf(Date);
      expect(back.result?.[field].getTime()).not.toBeNaN();
    }
  });

  it("soporta pedido sin result (PENDING)", () => {
    const json = serializeForCookie(makeOrder({ result: null, paymentStatus: "PENDING" }));
    const back = deserializeOrder(JSON.parse(json) as Parameters<typeof deserializeOrder>[0]);
    expect(back.result).toBeNull();
    expect(back.paymentStatus).toBe("PENDING");
    expect(back.createdAt).toBeInstanceOf(Date);
  });

  it("descarta el texto si el payload excede el límite", () => {
    const big = makeOrder({ result: { ...makeOrder().result!, textContent: "x".repeat(5000) } });
    const json = serializeForCookie(big);
    expect(Buffer.byteLength(json, "utf8")).toBeLessThan(4000);
    const back = deserializeOrder(JSON.parse(json) as Parameters<typeof deserializeOrder>[0]);
    expect(back.result?.textContent).toBeNull();
    expect(back.result?.imageBytes).toBeNull();
  });

  it("conserva confirmedAt null cuando no fue confirmado", () => {
    const json = serializeForCookie(makeOrder({ confirmedAt: null, paymentStatus: "PENDING" }));
    const back = deserializeOrder(JSON.parse(json) as Parameters<typeof deserializeOrder>[0]);
    expect(back.confirmedAt).toBeNull();
  });
});
