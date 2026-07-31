import "server-only";
import { prisma } from "@/lib/db/prisma";

export function getProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" }
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

export function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}
