import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-line">
      <div className="container-x flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-lg">
          Random<span className="text-primary"> Dreams</span>
        </Link>
        <nav className="flex items-center gap-6" aria-label="Principal">
          <Link href="/" className="text-sm font-medium text-muted hover:text-ink">
            Catálogo
          </Link>
          <span
            className="text-sm font-medium text-muted cursor-default"
            title="Disponible en V1"
            aria-disabled="true"
          >
            Cuenta
          </span>
        </nav>
      </div>
    </header>
  );
}
