"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function ErrorToast() {
  const { toast } = useToast();

  useEffect(() => {
    toast("La creación falló, probá en otra realidad.", "error");
  }, [toast]);

  return null;
}
