import Link from "next/link";

export function OrderNotFound() {
  return (
    <div className="container-x max-w-xl py-16">
      <div className="rounded-[4px] border border-primary/30 bg-night-card/60 p-8 text-center">
        <h1 className="font-serif text-xl uppercase tracking-[2px] text-ink">
          Este pedido ya fue triturado
        </h1>
        <p className="mt-3 text-sm text-muted">
          Los pedidos no se guardan para siempre: realizá uno nuevo y la magia vuelve a funcionar.
        </p>
        <Link
          href="/"
          className="btn-gold mt-6 inline-flex items-center justify-center"
        >
          Ir al catálogo
        </Link>
      </div>
    </div>
  );
}
