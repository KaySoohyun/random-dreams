"use client";

import { useFormStatus } from "react-dom";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
      {pending ? "Confirmando…" : "Confirmar y generar"}
    </button>
  );
}

export function ConfirmForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action}>
      <ConfirmButton />
    </form>
  );
}
