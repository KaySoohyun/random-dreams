"use client";

import { useActionState, useState } from "react";
import { formDataToObject, validateForm } from "./build-form-schema";
import { NumberField, MultiSelectField, SelectField, TextField } from "./fields";
import type { FormActionState, FormSchema } from "./types";

type DynamicFormProps = {
  formSchema: FormSchema;
  action: (prevState: FormActionState, formData: FormData) => Promise<FormActionState>;
  submitLabel?: string;
};

export function DynamicForm({ formSchema, action, submitLabel = "Continuar" }: DynamicFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const errors = { ...clientErrors, ...(state.errors ?? {}) };
  const values = state.values ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const raw = formDataToObject(formSchema, new FormData(event.currentTarget));
    const result = validateForm(formSchema, raw);
    if (!result.success) {
      event.preventDefault();
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
  }

  function renderField(field: FormSchema["fields"][number]) {
    const props = {
      field,
      defaultValue: values[field.name] ?? "",
      error: errors[field.name]
    };
    switch (field.type) {
      case "text":
        return <TextField key={field.name} {...props} />;
      case "number":
        return <NumberField key={field.name} {...props} />;
      case "select":
        return <SelectField key={field.name} {...props} />;
      case "multiselect":
        return <MultiSelectField key={field.name} {...props} />;
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
      {formSchema.fields.map(renderField)}
      {state.serverError && (
        <p role="alert" className="text-sm text-danger">
          {state.serverError}
        </p>
      )}
      <button type="submit" disabled={isPending} className="btn btn-primary w-full py-2.5">
        {isPending ? "Enviando…" : submitLabel}
      </button>
    </form>
  );
}
