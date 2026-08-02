import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrderGeneration } from "@/lib/services/orders";
import { generateImageAction, retryGenerationAction } from "@/features/result/actions";
import { AutoRefresh } from "@/features/result/auto-refresh";
import { ImageGenerateForm } from "@/features/result/image-generate-form";
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

const iconBtnClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-primary/35 text-primary transition-colors hover:border-primary hover:text-primary-hover";

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
  const imageAction = generateImageAction.bind(null, orderId);

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
            {status === "COMPLETED" && (
              <div className="flex items-center gap-2">
                {generatedResult.textContent && (
                  <a
                    href={`/api/resultado/${orderId}?formato=texto&descarga=1`}
                    download
                    className={iconBtnClass}
                    title="Descargar texto (.txt)"
                    aria-label="Descargar texto (.txt)"
                  >
                    <FileTextIcon />
                  </a>
                )}
                {generatedResult.imageBytes && (
                  <a
                    href={`/api/resultado/${orderId}?formato=imagen&descarga=1`}
                    download
                    className={iconBtnClass}
                    title="Descargar imagen"
                    aria-label="Descargar imagen"
                  >
                    <ImageIcon />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {status === "COMPLETED" && generatedResult.textContent ? (
          <>
            <div
              className={
                generatedResult.imageBytes
                  ? "mt-6 grid items-start gap-6 md:grid-cols-2"
                  : "mt-6"
              }
            >

              <div className="markdown-body rounded-lg border border-line bg-mist p-4">
                <ReactMarkdown>{generatedResult.textContent}</ReactMarkdown>
              </div>


              {generatedResult.imageBytes ? (
                <div className="relative aspect-[4/3] rounded-lg border border-line overflow-hidden bg-mist">
                  <Image
                    src={`/api/resultado/${orderId}?formato=imagen`}
                    alt={`Imagen generada para ${order.product.name}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 512px"
                  />
                </div>
              ) : null}
            </div>

            {!generatedResult.imageBytes && (
              <>
                <p className="text-sm text-muted mt-6">
                  ¿Querés que además generemos una imagen para tu creación?
                </p>
                <div className="mt-4">
                  <ImageGenerateForm action={imageAction} />
                </div>
              </>
            )}
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
              Estamos generando tu texto e imagen. Suele tardar unos segundos: no cierres esta
              página.
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
