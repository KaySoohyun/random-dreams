import "server-only";
import { prisma } from "@/lib/db/prisma";

const CACHE_TTL_MS = 30_000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value as T);
  }
  return loader().then((value) => {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  });
}

export function getProducts() {
  return cached("products", () =>
    prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" }
    })
  );
}

export function getProductBySlug(slug: string) {
  return cached(`slug:${slug}`, () => prisma.product.findUnique({ where: { slug } }));
}

export function getProductById(id: string) {
  return cached(`id:${id}`, () => prisma.product.findUnique({ where: { id } }));
}

export function clearProductCache() {
  cache.clear();
}
