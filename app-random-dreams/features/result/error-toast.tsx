"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function ErrorToast({ message }: { message?: string | null }) {
  const { toast } = useToast();

  useEffect(() => {
    toast(message ?? "Lo sentimos, no pudimos generar tu creación.", "error");
  }, [message, toast]);

  return null;
}
