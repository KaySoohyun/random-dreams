"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function GenerateImageButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2.5">
      {pending ? "Generando imagen…" : "Generar imagen"}
    </button>
  );
}

export function ImageGenerateForm({
  action
}: {
  action: (prev: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <GenerateImageButton />
    </form>
  );
}
