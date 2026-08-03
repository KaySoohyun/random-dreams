"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
      {pending ? (
        <>
          <Spinner size="sm" label="Confirmando pedido" />
          Confirmando…
        </>
      ) : (
        "Confirmar y generar"
      )}
    </button>
  );
}

export function ConfirmForm({
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
    if (state?.error) toast(state.error, "error");
  }, [state?.error, toast]);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <ConfirmButton />
    </form>
  );
}
