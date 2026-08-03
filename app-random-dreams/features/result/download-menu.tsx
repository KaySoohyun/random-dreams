"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

function DownloadIcon() {
  return (
    <svg
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

function FilePdfIcon() {
  return (
    <svg
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
      <path d="M9 15h6" />
      <path d="M9 18h6" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg
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

function ImageIcon() {
  return (
    <svg
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

const triggerClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-primary/35 text-primary transition-colors hover:border-primary hover:text-primary-hover";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[2px] px-3 py-2 text-sm text-ink transition-colors hover:bg-mist hover:text-primary";

const itemDisabledClass =
  "flex w-full items-center gap-2.5 rounded-[2px] px-3 py-2 text-sm text-faint/60 transition-colors";

export function DownloadMenu({
  textContent,
  imageDataUrl,
  fileNameBase
}: {
  textContent: string | null;
  imageDataUrl: string | null;
  fileNameBase: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const hasText = Boolean(textContent);
  const hasImage = Boolean(imageDataUrl);

  const notifyDownload = (name: string) => toast(`Descarga iniciada: ${name}`, "info");

  const downloadText = () => {
    if (!textContent) return;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${fileNameBase}.txt`);
    setOpen(false);
    notifyDownload(`${fileNameBase}.txt`);
  };

  const downloadPdf = async () => {
    if (!textContent) return;
    const { renderResultPdfClient } = await import("@/lib/pdf/client-pdf");
    const blob = await renderResultPdfClient(textContent);
    triggerDownload(blob, `${fileNameBase}.pdf`);
    setOpen(false);
    notifyDownload(`${fileNameBase}.pdf`);
  };

  const downloadImage = async () => {
    if (!imageDataUrl) return;
    const extension = imageDataUrl.startsWith("data:image/png") ? "png" : "jpg";
    const blob = await (await fetch(imageDataUrl)).blob();
    triggerDownload(blob, `${fileNameBase}.${extension}`);
    setOpen(false);
    notifyDownload(`${fileNameBase}.${extension}`);
  };

  const selectItem = (handler: () => void) => () => void handler();

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Descargar"
        aria-label="Descargar resultado"
      >
        <DownloadIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 min-w-44 rounded-[4px] border border-primary/30 bg-night-panel p-1 shadow-lg"
        >
          <MenuItem
            icon={<FilePdfIcon />}
            label="PDF (.pdf)"
            disabled={!hasText}
            onSelect={selectItem(downloadPdf)}
          />
          <MenuItem
            icon={<FileTextIcon />}
            label="Texto (.txt)"
            disabled={!hasText}
            onSelect={selectItem(downloadText)}
          />
          <MenuItem
            icon={<ImageIcon />}
            label="Imagen"
            disabled={!hasImage}
            onSelect={selectItem(downloadImage)}
          />
        </div>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MenuItem({
  icon,
  label,
  disabled,
  onSelect
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  if (disabled) {
    return (
      <div
        role="menuitem"
        aria-disabled="true"
        title="No disponible"
        className={`${itemDisabledClass} cursor-not-allowed`}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onSelect} className={itemClass}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
