import { useMemo, useState } from "react";
import type { FormField } from "./types";

type FieldProps = {
  field: FormField;
  defaultValue?: string;
  error?: string;
};

function FieldWrapper({
  field,
  error,
  hint,
  children
}: FieldProps & { hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label" htmlFor={field.name}>
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${field.name}-error`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ field, defaultValue, error }: FieldProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        id={field.name}
        name={field.name}
        type="text"
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`field-input ${error ? "!border-danger" : ""}`}
      />
    </FieldWrapper>
  );
}

export function NumberField({ field, defaultValue, error }: FieldProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        id={field.name}
        name={field.name}
        type="number"
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`field-input ${error ? "!border-danger" : ""}`}
      />
    </FieldWrapper>
  );
}

export function SelectField({ field, defaultValue, error }: FieldProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <select
        id={field.name}
        name={field.name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`field-input ${error ? "!border-danger" : ""}`}
      >
        <option value="">Seleccioná…</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function MultiSelectField({ field, defaultValue, error }: FieldProps) {
  const options = field.options ?? [];
  const initial = useMemo(
    () =>
      (defaultValue ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    [defaultValue]
  );
  const [selected, setSelected] = useState<string[]>(initial);

  function toggle(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  const hint =
    field.min !== undefined || field.max !== undefined
      ? `Elegí ${field.min ?? 0}${field.max !== undefined ? ` a ${field.max}` : "+"} opciones`
      : undefined;

  return (
    <FieldWrapper field={field} error={error} hint={hint}>
      <input type="hidden" name={field.name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={field.label}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                active
                  ? "bg-primary-light border-primary text-primary"
                  : "border-line text-ink hover:border-primary"
              }`}
            >
              {active ? "✓ " : ""}
              {option}
            </button>
          );
        })}
      </div>
    </FieldWrapper>
  );
}
