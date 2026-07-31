import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    order: { groupBy: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    generatedResult: { groupBy: vi.fn() }
  }
}));

import { prisma } from "@/lib/db/prisma";
import { getAdminDashboard, getOrderDetail, listOrders } from "@/lib/services/admin";

describe("admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAdminDashboard devuelve conteos por estado y las últimas 10 órdenes", async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { paymentStatus: "PENDING", _count: { _all: 3 } },
      { paymentStatus: "APPROVED", _count: { _all: 2 } }
    ] as never);
    vi.mocked(prisma.generatedResult.groupBy).mockResolvedValue([
      { aiResponseStatus: "COMPLETED", _count: { _all: 5 } }
    ] as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { id: "ord_1", product: { name: "X" } }
    ] as never);

    const dashboard = await getAdminDashboard();

    expect(dashboard.orderCounts).toEqual({ PENDING: 3, APPROVED: 2 });
    expect(dashboard.resultCounts).toEqual({ COMPLETED: 5 });
    expect(dashboard.recentOrders).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { product: true }
    });
  });

  it("listOrders filtra por estado, busca por id y pagina de a 10", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.count).mockResolvedValue(25);

    const result = await listOrders({ status: "PENDING", q: "ord", page: 2 });

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { paymentStatus: "PENDING", id: { contains: "ord", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
      include: { product: true }
    });
    expect(result.total).toBe(25);
    expect(result.pages).toBe(3);
    expect(result.page).toBe(2);
  });

  it("listOrders ignora filtros inválidos y arranca en la página 1", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await listOrders({ status: "INVALIDO", q: "  ", page: -3 });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0 })
    );
  });

  it("getOrderDetail incluye producto, submission, resultado y logs desc", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: "ord_1" } as never);

    await getOrderDetail("ord_1");

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: "ord_1" },
      include: {
        product: true,
        formSubmission: true,
        generatedResult: true,
        generationLogs: { orderBy: { createdAt: "desc" } }
      }
    });
  });
});
