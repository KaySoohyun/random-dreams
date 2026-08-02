import type { ProductModel } from "@/lib/generated/prisma/models";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductModel[] }) {
  return (
    <section
      id="catalogo"
      className="grid grid-cols-1 gap-8 pb-20 scroll-mt-24 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Catálogo de productos"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
