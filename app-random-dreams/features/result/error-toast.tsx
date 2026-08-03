"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function ErrorToast({ message }: { message?: string | null }) {
  const { toast } = useToast();

  useEffect(() => {
    toast(message ?? "La creación falló, probá en otra realidad.", "error");
  }, [message, toast]);

  return null;
}
