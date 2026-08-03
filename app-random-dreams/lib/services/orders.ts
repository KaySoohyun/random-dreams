import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function createPendingOrder({
  productId,
  formData
}: {
  productId: string;
  formData: Prisma.InputJsonValue;
}) {
  const orderId = randomUUID();
  const submissionId = randomUUID();
  const [row] = await prisma.$queryRaw<Array<{ id: string }>>`
    with new_order as (
      insert into "Order" (id, "productId", "paymentStatus", "createdAt", "updatedAt")
      values (${orderId}, ${productId}, 'PENDING', now(), now())
      returning id
    )
    insert into "FormSubmission" (id, "orderId", "formData", "createdAt")
    select ${submissionId}, id, ${JSON.stringify(formData)}::jsonb, now()
    from new_order
    returning "orderId" as id`;
  return { id: row?.id ?? orderId, productId, paymentStatus: "PENDING" as const };
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { product: true }
  });
}

type CheckoutOrderRow = {
  id: string;
  productId: string;
  paymentStatus: string;
  confirmedAt: Date | null;
  productSlug: string;
  productName: string;
  productDescription: string;
  productFormSchema: unknown;
  submissionFormData: unknown;
};

export type CheckoutOrder = {
  id: string;
  productId: string;
  paymentStatus: string;
  confirmedAt: Date | null;
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    formSchema: unknown;
  };
  formSubmission: {
    orderId: string;
    formData: Prisma.JsonValue;
  } | null;
};

export async function getCheckoutOrder(id: string): Promise<CheckoutOrder | null> {
  const [row] = await prisma.$queryRaw<Array<CheckoutOrderRow>>`
    select o.id, o."productId", o."paymentStatus", o."confirmedAt",
           p.id as "productId", p.slug as "productSlug",
           p.name as "productName", p.description as "productDescription",
           p."formSchema" as "productFormSchema",
           fs."formData" as "submissionFormData"
    from "Order" o
    join "Product" p on p.id = o."productId"
    left join "FormSubmission" fs on fs."orderId" = o.id
    where o.id = ${id}`;
  if (!row) return null;
  return {
    id: row.id,
    productId: row.productId,
    paymentStatus: row.paymentStatus,
    confirmedAt: row.confirmedAt,
    product: {
      id: row.productId,
      slug: row.productSlug,
      name: row.productName,
      description: row.productDescription,
      formSchema: row.productFormSchema
    },
    formSubmission:
      row.submissionFormData === null || row.submissionFormData === undefined
        ? null
        : { orderId: row.id, formData: row.submissionFormData as Prisma.JsonValue }
  };
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
