import Link from "next/link";
import Image from "next/image";
import type { ProductModel } from "@/lib/generated/prisma/models";

export function ProductCard({ product }: { product: ProductModel }) {
  return (
    <article className="group relative flex h-[495px] w-full max-w-md flex-col overflow-hidden rounded-[4px] border border-primary/30 bg-night-card/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary">
      <div className="relative  aspect-[3/4] max-w-full min-h-0 flex-1 overflow-hidden bg-mist">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`Ilustración de ${product.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-contain transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-sm text-muted"
            aria-hidden="true"
          >
            [ilustración]
          </div>
        )}
      </div>

      <div className="flex flex-col p-5">
        <h2 className="line-clamp-2 font-serif text-sm uppercase leading-snug tracking-[1.5px] text-ink">
          {product.name}
        </h2>
        <p className="mt-1.5 text-xs text-muted">{product.tagline}</p>
      </div>

      <Link
        href={`/producto/${product.slug}`}
        className="absolute inset-0 z-10 flex items-end justify-start p-5"
      >
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-primary transition-colors group-hover:text-primary-hover">
          Crear
        </span>
      </Link>
    </article>
  );
}
