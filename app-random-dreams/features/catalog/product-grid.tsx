import type { ProductModel } from "@/lib/generated/prisma/models";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductModel[] }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20" aria-label="Catálogo de productos">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
