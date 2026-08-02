import Link from "next/link";
import { getAdminDashboard } from "@/lib/services/admin";
import { OrderTable } from "@/features/admin/order-table";

const paymentLabels: Record<string, string> = {
  PENDING: "Pendientes",
  APPROVED: "Aprobadas",
  REJECTED: "Rechazadas"
};

const resultLabels: Record<string, string> = {
  QUEUED: "En cola",
  PROCESSING: "Procesando",
  COMPLETED: "Completadas",
  ERROR: "Con error"
};

export default async function AdminDashboardPage() {
  const { orderCounts, resultCounts, recentOrders } = await getAdminDashboard();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">Órdenes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {Object.keys(paymentLabels).map((status) => (
            <div key={status} className="border border-line rounded-xl p-4">
              <p className="text-sm text-muted">{paymentLabels[status]}</p>
              <p className="text-2xl font-bold mt-1">{orderCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">Generaciones</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {Object.keys(resultLabels).map((status) => (
            <div key={status} className="border border-line rounded-xl p-4">
              <p className="text-sm text-muted">{resultLabels[status]}</p>
              <p className="text-2xl font-bold mt-1">{resultCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">Últimas órdenes</h2>
          <Link href="/admin/ordenes" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <OrderTable orders={recentOrders} />
      </section>
    </div>
  );
}
