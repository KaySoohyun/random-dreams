import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { adminLogoutAction } from "@/features/admin/actions";

export default async function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!(await getAdminSession())) redirect("/admin/login");

  return (
    <div className="container-x max-w-5xl py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-lg font-bold tracking-tight">Admin · Random Dreams</p>
          <p className="text-sm text-muted mt-0.5">Soporte y trazabilidad de órdenes.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          <Link href="/admin/ordenes" className="hover:text-primary">
            Órdenes
          </Link>
          <Link href="/" className="hover:text-primary">
            Volver al sitio
          </Link>
          <form action={adminLogoutAction}>
            <button type="submit" className="btn btn-outline px-3 py-1.5">
              Salir
            </button>
          </form>
        </nav>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}
