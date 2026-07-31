import Link from "next/link";
import { listOrders } from "@/lib/services/admin";
import { OrderTable } from "@/features/admin/order-table";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Rechazada" }
];

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const q = params.q ?? "";
  const page = Number(params.page ?? 1);
  const { orders, total, page: currentPage, pages } = await listOrders({ status, q, page });
  const pageLink = (p: number) =>
    `/admin/ordenes?status=${status}&q=${encodeURIComponent(q)}&page=${p}`;

  return (
    <div>
      <h2 className="font-semibold text-lg">Órdenes</h2>

      <form action="/admin/ordenes" method="get" className="mt-3 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="field-input w-auto">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por id…"
          className="field-input w-64"
        />
        <button type="submit" className="btn btn-primary px-4 py-2">
          Filtrar
        </button>
        <Link href="/admin/ordenes" className="btn btn-outline px-4 py-2">
          Limpiar
        </Link>
      </form>

      <p className="text-sm text-muted mt-4">
        {total} orden{total === 1 ? "" : "es"}
      </p>
      <OrderTable orders={orders} />

      {pages > 1 && (
        <nav className="flex items-center gap-3 mt-4 text-sm">
          {currentPage > 1 && (
            <Link href={pageLink(currentPage - 1)} className="btn btn-outline px-3 py-1.5">
              &larr; Anterior
            </Link>
          )}
          <span className="text-muted">
            Página {currentPage} de {pages}
          </span>
          {currentPage < pages && (
            <Link href={pageLink(currentPage + 1)} className="btn btn-outline px-3 py-1.5">
              Siguiente &rarr;
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
