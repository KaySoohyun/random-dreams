"use client";

import { useFormStatus } from "react-dom";

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2.5">
      {pending ? "Reintentando…" : "Reintentar generación"}
    </button>
  );
}

export function AdminRetryForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action}>
      <RetryButton />
    </form>
  );
}
