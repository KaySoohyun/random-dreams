import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    order: { findUnique: vi.fn() }
  }
}));

import { prisma } from "@/lib/db/prisma";
import {
  confirmOrder,
  createPendingOrder,
  getCheckoutOrder,
  getOrderById
} from "@/lib/services/orders";

const mockTransaction = vi.mocked(prisma.$transaction);

function orderWith(productId: string, paymentStatus: string, overrides: Record<string, unknown> = {}) {
  return {
    id: "ord_1",
    productId,
    paymentStatus,
    formSubmission: { formData: { nombre: "Martín" } },
    ...overrides
  };
}

describe("orders service", () => {
  beforeEach(() => {
    mockTransaction.mockReset();
  });

  it("crea una order PENDING y su FormSubmission en la misma transacción", async () => {
    const mockOrder = { id: "ord_1", productId: "p1", paymentStatus: "PENDING" };
    const tx = {
      order: { create: vi.fn().mockResolvedValue(mockOrder) },
      formSubmission: { create: vi.fn().mockResolvedValue({}) }
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));

    const order = await createPendingOrder({
      productId: "p1",
      formData: { nombre: "Martín" }
    });

    expect(order.id).toBe("ord_1");
    expect(tx.order.create).toHaveBeenCalledWith({
      data: { productId: "p1", paymentStatus: "PENDING" }
    });
    expect(tx.formSubmission.create).toHaveBeenCalledWith({
      data: { orderId: "ord_1", formData: { nombre: "Martín" } }
    });
  });

  it("devuelve la order con su producto", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "ord_1",
      product: { name: "Quimera" }
    } as never);

    const order = await getOrderById("ord_1");
    expect(order).not.toBeNull();
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: "ord_1" },
      include: { product: true }
    });
  });

  it("devuelve la order con producto y formSubmission para el checkout", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWith("p1", "PENDING") as never);

    const order = await getCheckoutOrder("ord_1");
    expect(order).not.toBeNull();
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: "ord_1" },
      include: { product: true, formSubmission: true }
    });
  });

  it("confirma un pedido PENDING: lo pasa a APPROVED, setea confirmedAt y crea el GeneratedResult QUEUED", async () => {
    const existing = orderWith("p1", "PENDING");
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockImplementation((args) =>
          Promise.resolve({ ...existing, ...args.data })
        )
      },
      generatedResult: { upsert: vi.fn().mockResolvedValue({}) }
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));

    const order = await confirmOrder("ord_1");

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: "ord_1" },
      data: { paymentStatus: "APPROVED", confirmedAt: expect.any(Date) }
    });
    expect(tx.generatedResult.upsert).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
      update: {},
      create: {
        orderId: "ord_1",
        productId: "p1",
        aiRequestPayload: { nombre: "Martín" }
      }
    });
    expect(order?.order.paymentStatus).toBe("APPROVED");
    expect(order?.transitioned).toBe(true);
  });

  it("es idempotente: un pedido ya APPROVED no se actualiza y reutiliza el GeneratedResult", async () => {
    const existing = orderWith("p1", "APPROVED");
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn()
      },
      generatedResult: { upsert: vi.fn().mockResolvedValue({}) }
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));

    const result = await confirmOrder("ord_1");

    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.generatedResult.upsert).toHaveBeenCalledTimes(1);
    expect(result?.order.paymentStatus).toBe("APPROVED");
    expect(result?.transitioned).toBe(false);
  });

  it("no confirma un pedido REJECTED", async () => {
    const existing = orderWith("p1", "REJECTED");
    const tx = {
      order: { findUnique: vi.fn().mockResolvedValue(existing), update: vi.fn() },
      generatedResult: { upsert: vi.fn() }
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));

    const result = await confirmOrder("ord_1");

    expect(result?.order.paymentStatus).toBe("REJECTED");
    expect(result?.transitioned).toBe(false);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.generatedResult.upsert).not.toHaveBeenCalled();
  });

  it("devuelve order null si el pedido no existe", async () => {
    const tx = {
      order: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
      generatedResult: { upsert: vi.fn() }
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));

    const result = await confirmOrder("ord_404");
    expect(result?.order).toBeNull();
    expect(result?.transitioned).toBe(false);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.generatedResult.upsert).not.toHaveBeenCalled();
  });
});
