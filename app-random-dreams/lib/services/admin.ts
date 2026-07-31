import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { PaymentStatus, Prisma } from "@/lib/generated/prisma/client";

const PAGE_SIZE = 10;

export type ListOrdersOptions = {
  status?: string;
  q?: string;
  page?: number;
};

export async function getAdminDashboard() {
  const [orderGroups, resultGroups, recentOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true }
    }),
    prisma.generatedResult.groupBy({
      by: ["aiResponseStatus"],
      _count: { _all: true }
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: { product: true }
    })
  ]);

  return {
    orderCounts: Object.fromEntries(orderGroups.map((g) => [g.paymentStatus, g._count._all])),
    resultCounts: Object.fromEntries(
      resultGroups.map((g) => [g.aiResponseStatus, g._count._all])
    ),
    recentOrders
  };
}

const paymentStatuses: PaymentStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function listOrders(options: ListOrdersOptions = {}) {
  const q = options.q?.trim();
  const page = Math.max(1, options.page ?? 1);
  const where: Prisma.OrderWhereInput = {};
  if (options.status && paymentStatuses.includes(options.status as PaymentStatus)) {
    where.paymentStatus = options.status as PaymentStatus;
  }
  if (q) {
    where.id = { contains: q, mode: "insensitive" };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: true }
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
  };
}

export function getOrderDetail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: true,
      formSubmission: true,
      generatedResult: true,
      generationLogs: { orderBy: { createdAt: "desc" } }
    }
  });
}
