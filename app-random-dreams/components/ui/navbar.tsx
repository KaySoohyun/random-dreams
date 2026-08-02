import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-[100] border-b border-primary/20 bg-night/90 backdrop-blur-sm">
      <div className="container-x flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary text-primary"
            aria-hidden="true"
          >
            ✧
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm uppercase tracking-[2px] text-ink">
              Random Dreams
            </span>
            <span className="text-[9px] uppercase tracking-[1px] text-primary">
              Realidades alternativas
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
