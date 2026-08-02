import Link from "next/link";
import { notFound } from "next/navigation";
import { adminRetryOrderAction } from "@/features/admin/actions";
import { AdminRetryForm } from "@/features/admin/retry-order-form";
import { OrderSummary } from "@/features/checkout/order-summary";
import { isFormSchema } from "@/features/forms/types";
import { getOrderDetail } from "@/lib/services/admin";

const paymentLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};

const statusLabels: Record<string, string> = {
  QUEUED: "En cola",
  PROCESSING: "Procesando",
  COMPLETED: "Completado",
  ERROR: "Error"
};

const stepLabels: Record<string, string> = {
  GENERATE_TEXT: "Generar texto",
  GENERATE_IMAGE: "Generar imagen",
  UPLOAD_RESULT: "Guardar resultado",
  MARK_COMPLETED: "Marcar completado"
};

const logStatusLabels: Record<string, string> = {
  RUNNING: "En curso",
  SUCCESS: "OK",
  FAILED: "Falló"
};

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 16).replace("T", " ") : "—";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderDetail(orderId);
  if (!order) notFound();

  const formSchema = isFormSchema(order.product.formSchema) ? order.product.formSchema : null;
  const result = order.generatedResult;
  const retryAction = adminRetryOrderAction.bind(null, order.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ordenes" className="text-sm text-muted hover:text-ink">
          &larr; Volver a órdenes
        </Link>
        <h2 className="mt-1 font-serif text-sm uppercase tracking-[1.5px] text-ink">Orden</h2>
        <p className="font-mono text-xs text-muted mt-0.5 break-all">{order.id}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          {formSchema ? (
            <OrderSummary
              productName={order.product.name}
              formSchema={formSchema}
              formData={order.formSubmission?.formData}
            />
          ) : (
            <p className="text-sm text-muted">El resumen de este producto no está disponible.</p>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[4px] border border-primary/30 bg-night-card/60 p-6">
            <h3 className="font-serif text-xs uppercase tracking-[1.5px] text-ink">Pedido</h3>
            <dl className="mt-4 space-y-3">
              <Stat label="Estado de pago" value={paymentLabels[order.paymentStatus] ?? order.paymentStatus} />
              <Stat label="Creada" value={formatDate(order.createdAt)} />
              <Stat label="Confirmada" value={formatDate(order.confirmedAt)} />
            </dl>
          </div>

          <div className="rounded-[4px] border border-primary/30 bg-night-card/60 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xs uppercase tracking-[1.5px] text-ink">Generación</h3>
              <Link
                href={`/generacion/${order.id}`}
                className="text-sm text-primary hover:underline"
              >
                Ver resultado público
              </Link>
            </div>
            {result ? (
              <>
                <dl className="mt-4 space-y-3">
                  <Stat label="Estado" value={statusLabels[result.aiResponseStatus] ?? result.aiResponseStatus} />
                  <Stat label="Reintentos" value={result.retryCount} />
                  <Stat label="Iniciada" value={formatDate(result.startedAt)} />
                  <Stat label="Completada" value={formatDate(result.completedAt)} />
                </dl>
                {result.error && (
                  <p className="text-sm text-danger mt-4">Error: {result.error}</p>
                )}
                {result.aiResponseStatus === "ERROR" && (
                  <div className="mt-5">
                    <AdminRetryForm action={retryAction} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted mt-4">Sin resultado de generación.</p>
            )}
          </div>
        </section>
      </div>

      <section>
        <h3 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">Logs de generación</h3>
        {order.generationLogs.length === 0 ? (
          <p className="text-sm text-muted mt-3">Sin logs.</p>
        ) : (
          <div className="overflow-x-auto border border-line rounded-xl mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  <th className="px-4 py-2 font-medium">Paso</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Duración (ms)</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {order.generationLogs.map((log) => (
                  <tr key={log.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-2">{stepLabels[log.step] ?? log.step}</td>
                    <td className="px-4 py-2">{logStatusLabels[log.status] ?? log.status}</td>
                    <td className="px-4 py-2 text-muted">{log.durationMs ?? "—"}</td>
                    <td className="px-4 py-2 text-muted">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2">
                      {log.error ? (
                        <p className="text-danger">{log.error}</p>
                      ) : log.payload ? (
                        <code className="text-xs break-all whitespace-pre-wrap">
                          {JSON.stringify(log.payload)}
                        </code>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
