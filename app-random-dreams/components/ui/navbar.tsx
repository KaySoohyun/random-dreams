import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 z-[100] border-b border-primary/20 bg-night/90 backdrop-blur-sm">
      <div className="container-x flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/logo.png"
            alt="Random Dreams"
            width={1787}
            height={762}
            priority
            className="h-14 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}
