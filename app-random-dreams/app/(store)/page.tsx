import { Hero } from "@/features/catalog/hero";
import { ProductGrid } from "@/features/catalog/product-grid";
import { getProducts } from "@/lib/services/products";

export default async function CatalogPage() {
  const products = await getProducts();
  return (
    <>
      <Hero />
      <div className="container-x">
        <ProductGrid products={products} />
      </div>
    </>
  );
}
