"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useEffect } from "react";

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2.5">
      {pending ? (
        <>
          <Spinner size="sm" label="Reintentando" />
          Reintentando…
        </>
      ) : (
        "Reintentar"
      )}
    </button>
  );
}

export function RetryForm({
  action
}: {
  action: (
    prev: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string }>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) toast("No se pudo reintentar, probá en otra realidad.", "error");
  }, [state?.error, toast]);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-muted">No se pudo reintentar, probá en otra realidad.</p>
      )}
      <RetryButton />
    </form>
  );
}
