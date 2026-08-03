"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

function GenerateImageButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2.5">
      {pending ? (
        <>
          <Spinner size="sm" label="Generando imagen" />
          Generando imagen…
        </>
      ) : (
        "Generar imagen"
      )}
    </button>
  );
}

export function ImageGenerateForm({
  action
}: {
  action: (prev: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) toast(state.error, "error");
  }, [state?.error, toast]);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <GenerateImageButton />
    </form>
  );
}
