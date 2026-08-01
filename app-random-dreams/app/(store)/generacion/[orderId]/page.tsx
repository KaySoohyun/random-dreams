import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderGeneration } from "@/lib/services/orders";
import { retryGenerationAction } from "@/features/result/actions";
import { AutoRefresh } from "@/features/result/auto-refresh";
import { RetryForm } from "@/features/result/retry-form";

export async function generateMetadata({
  params
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getOrderGeneration(orderId);
  return { title: order ? `${order.product.name} · Tu creación` : "Tu creación" };
}

const statusLabel: Record<string, string> = {
  QUEUED: "En cola…",
  PROCESSING: "Generando…",
  COMPLETED: "Completado",
  ERROR: "Error"
};

export default async function GenerationPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderGeneration(orderId);
  if (!order?.generatedResult) notFound();

  const { generatedResult } = order;
  const status = generatedResult.aiResponseStatus;
  const isTerminal = status === "COMPLETED" || status === "ERROR";
  const retryAction = retryGenerationAction.bind(null, orderId);

  return (
    <div className="container-x max-w-2xl py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        &larr; Volver al catálogo
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mt-4">Tu creación</h1>

      <div className="border border-line rounded-xl p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{order.product.name}</h2>
          <span className="text-sm text-muted">
            Estado: <span className="font-medium text-ink">{statusLabel[status] ?? status}</span>
          </span>
        </div>

        {status === "COMPLETED" && generatedResult.textContent ? (
          <>
            <p className="text-sm text-muted mt-5">Tu texto personalizado:</p>
            <div className="whitespace-pre-wrap rounded-lg border border-line bg-mist p-4 mt-2 text-sm">
              {generatedResult.textContent}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={`/api/resultado/${orderId}?formato=texto&descarga=1`}
                download
                className="btn btn-primary px-4 py-2.5"
              >
                Descargar texto (.txt)
              </a>
            </div>
          </>
        ) : status === "ERROR" ? (
          <>
            <p className="text-sm text-muted mt-5">
              Lo sentimos, no pudimos generar tu creación.
            </p>
            {generatedResult.error && (
              <p className="text-sm text-danger mt-2">{generatedResult.error}</p>
            )}
            <div className="mt-6">
              <RetryForm action={retryAction} />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mt-5">
              Estamos generando tu texto. Suele tardar unos segundos: no cierres esta página.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted">{statusLabel[status] ?? status}</span>
            </div>
          </>
        )}
      </div>

      {!isTerminal && <AutoRefresh status={status} />}
    </div>
  );
}
