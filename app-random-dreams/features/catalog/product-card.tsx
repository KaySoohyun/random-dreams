import Link from "next/link";
import Image from "next/image";
import type { ProductModel } from "@/lib/generated/prisma/models";

export function ProductCard({ product }: { product: ProductModel }) {
  return (
    <article className="border border-line rounded-xl overflow-hidden flex flex-col">
      {product.imageUrl ? (
        <div className="relative h-36 w-full">
          <Image
            src={product.imageUrl}
            alt={`Ilustración de ${product.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className="h-36 bg-mist flex items-center justify-center text-sm text-muted"
          aria-hidden="true"
        >
          [ilustración]
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-semibold">{product.name}</h2>
        <p className="text-sm text-muted mt-1 flex-1">{product.tagline}</p>
        <Link href={`/producto/${product.slug}`} className="btn btn-primary w-full mt-4 py-2">
          Crear
        </Link>
      </div>
    </article>
  );
}
