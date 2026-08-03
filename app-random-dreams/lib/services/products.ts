import "server-only";
import {
  getProductByIdData,
  getProductBySlugData,
  getProductsData,
  products,
  type CatalogProduct
} from "@/lib/data/products";

export type { CatalogProduct } from "@/lib/data/products";

export function getProducts(): CatalogProduct[] {
  return getProductsData();
}

export function getProductBySlug(slug: string): CatalogProduct | null {
  return getProductBySlugData(slug);
}

export function getProductById(id: string): CatalogProduct | null {
  return getProductByIdData(id);
}

export const allProducts = products;
