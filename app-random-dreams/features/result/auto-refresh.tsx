"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "COMPLETED" || status === "ERROR") return;
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [router, status]);

  return null;
}
