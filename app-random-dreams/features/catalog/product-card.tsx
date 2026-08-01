import Link from "next/link";
import Image from "next/image";
import type { ProductModel } from "@/lib/generated/prisma/models";

export function ProductCard({ product }: { product: ProductModel }) {
  return (
    <article className="max-w-md w-full h-[496px] bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-candy-lavender/40 overflow-hidden flex flex-col group">
      {product.imageUrl ? (
        <div className="h-[75%] w-full relative overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={`Ilustración de ${product.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-candy-pink/50 via-candy-lavender/30 to-candy-sky/40 pointer-events-none"></div>
        </div>
      ) : (
        <div
          className="h-[75%] w-full bg-mist flex items-center justify-center text-sm text-muted"
          aria-hidden="true"
        >
          [ilustración]

        </div>
      )}

      <div className="h-[25%] p-6 flex flex-col justify-between bg-white/50">
        <div>
          <h2 className="text-xl font-extrabold text-candy-plum-dark leading-snug line-clamp-2">
            {product.name}
          </h2>
        </div>

        <Link
          href={`/producto/${product.slug}`}
          className="btn-gradient-candy text-candy-plum-dark font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm tracking-wide w-full mt-2"
        >
          Crear
        </Link>
      </div>
    </article>
  );
}
