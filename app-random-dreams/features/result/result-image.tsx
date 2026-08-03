"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export function ImageUnavailable() {
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-line bg-transparent p-4">
      <p className="text-center text-base font-bold uppercase tracking-[1px] text-gold">
        Imagen no disponible
      </p>
    </div>
  );
}

export function ResultImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return <ImageUnavailable />;
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-mist">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" className="text-primary" label="Cargando imagen" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image no dispara onError con la ruta dinámica /api/resultado/[orderId] */}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-contain ${
          loaded ? "opacity-100" : "opacity-0"
        } transition-opacity`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
