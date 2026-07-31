"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminLoginAction } from "./actions";

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
      {pending ? "Ingresando…" : "Ingresar"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Token de administración</span>
        <input
          type="password"
          name="token"
          required
          autoComplete="current-password"
          className="field-input"
          placeholder="••••••••"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <LoginButton />
    </form>
  );
}
