import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function createPendingOrder({
  productId,
  formData
}: {
  productId: string;
  formData: Prisma.InputJsonValue;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { productId, paymentStatus: "PENDING" }
    });
    await tx.formSubmission.create({
      data: { orderId: order.id, formData }
    });
    return order;
  });
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { product: true }
  });
}

export function getCheckoutOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { product: true, formSubmission: true }
  });
}

export function getOrderGeneration(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { product: true, generatedResult: true }
  });
}

export async function confirmOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      include: { formSubmission: true }
    });
    if (!existing) return { order: null, transitioned: false };
    if (existing.paymentStatus === "REJECTED") {
      return { order: existing, transitioned: false };
    }
    if (existing.paymentStatus === "APPROVED") {
      await upsertGeneratedResult(tx, existing, existing.formSubmission?.formData);
      return { order: existing, transitioned: false };
    }

    const order = await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "APPROVED", confirmedAt: new Date() }
    });
    await upsertGeneratedResult(tx, order, existing.formSubmission?.formData);
    return { order, transitioned: true };
  });
}

function upsertGeneratedResult(
  tx: Prisma.TransactionClient,
  order: { id: string; productId: string },
  formData: Prisma.JsonValue | undefined
) {
  return tx.generatedResult.upsert({
    where: { orderId: order.id },
    update: {},
    create: {
      orderId: order.id,
      productId: order.productId,
      aiRequestPayload: (formData ?? {}) as Prisma.InputJsonValue
    }
  });
}
