import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrderGeneration } from "@/lib/services/orders";
import { retryGenerationAction } from "@/features/result/actions";
import { OrderNotFound } from "@/features/result/order-not-found";
import { AutoRefresh } from "@/features/result/auto-refresh";
import { ImageUnavailable, ResultImage } from "@/features/result/result-image";
import { RetryForm } from "@/features/result/retry-form";
import { DownloadMenu } from "@/features/result/download-menu";
import { ErrorToast } from "@/features/result/error-toast";
import { Spinner } from "@/components/ui/spinner";
import { imageBytesToDataUrl } from "@/lib/ai/image-format";
import { buildResultBaseName, firstNameValue } from "@/lib/services/generation";

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
  if (!order) return <OrderNotFound />;
  if (!order.generatedResult) redirect(`/checkout/${orderId}`);

  const { generatedResult } = order;
  const status = generatedResult.aiResponseStatus;
  const isTerminal = status === "COMPLETED" || status === "ERROR";
  const retryAction = retryGenerationAction.bind(null, orderId);

  const imageDataUrl = generatedResult.imageBytes
    ? imageBytesToDataUrl(new Uint8Array(generatedResult.imageBytes))
    : null;
  const fileNameBase = buildResultBaseName({
    slug: order.product.slug,
    nameValue: firstNameValue(order.formSchema, order.formData)
  });

  return (
    <div className="container-x max-w-4xl py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        &larr; Volver al catálogo
      </Link>
      <h1 className="mt-4 font-serif text-2xl uppercase tracking-[2px] font-normal text-ink">
        Tu creación
      </h1>

      <div className="mt-6 rounded-[4px] border border-primary/30 bg-night-card/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">
            {order.product.name}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
              Estado: <span className="font-medium text-ink">{statusLabel[status] ?? status}</span>
            </span>
            {status === "COMPLETED" && generatedResult.textContent && (
              <DownloadMenu
                textContent={generatedResult.textContent}
                imageDataUrl={imageDataUrl}
                fileNameBase={fileNameBase}
              />
            )}
          </div>
        </div>

        {status === "COMPLETED" && generatedResult.textContent ? (
          <>
            <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
              <div className="markdown-body rounded-lg border border-line bg-mist p-4">
                <ReactMarkdown>{generatedResult.textContent}</ReactMarkdown>
              </div>

              {generatedResult.imageBytes ? (
                <ResultImage
                  src={imageDataUrl ?? ""}
                  alt={`Imagen generada para ${order.product.name}`}
                />
              ) : (
                <ImageUnavailable />
              )}
            </div>
          </>
        ) : status === "ERROR" ? (
          <>
            <p className="text-sm text-muted mt-5">
              La creación falló, probá en otra realidad.
            </p>
            <div className="mt-6">
              <RetryForm action={retryAction} />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mt-5">
              Espera unos segundos hasta que ocurra la magía. No cierres la página o tu pedido será
              triturado.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Spinner size="md" className="text-primary" label={statusLabel[status] ?? status} />
              <span className="text-sm text-muted">{statusLabel[status] ?? status}</span>
            </div>
          </>
        )}
      </div>

      {status === "ERROR" && <ErrorToast />}
      {!isTerminal && <AutoRefresh status={status} />}
    </div>
  );
}
