import Link from "next/link";

const paymentLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};

type OrderRow = {
  id: string;
  paymentStatus: string;
  createdAt: Date;
  product: { name: string };
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted mt-3">Sin órdenes.</p>;
  }

  return (
    <div className="overflow-x-auto border border-line rounded-xl mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            <th className="px-4 py-2 font-medium">Orden</th>
            <th className="px-4 py-2 font-medium">Producto</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Creada</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-line last:border-0 hover:bg-mist">
              <td className="px-4 py-2">
                <Link
                  href={`/admin/ordenes/${order.id}`}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {order.id}
                </Link>
              </td>
              <td className="px-4 py-2">{order.product.name}</td>
              <td className="px-4 py-2">
                {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
              </td>
              <td className="px-4 py-2 text-muted">
                {order.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
