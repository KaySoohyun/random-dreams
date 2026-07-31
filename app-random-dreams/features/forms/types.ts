export type FormFieldType = "text" | "number" | "select" | "multiselect";

export type FormField = {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
};

export type FormSchema = {
  fields: FormField[];
};

export type FormActionState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  serverError?: string;
};

export function isFormSchema(value: unknown): value is FormSchema {
  if (!value || typeof value !== "object") return false;
  const fields = (value as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return false;
  const supported: FormFieldType[] = ["text", "number", "select", "multiselect"];
  return fields.every((field) => {
    const f = field as Record<string, unknown>;
    return (
      typeof f.name === "string" &&
      typeof f.label === "string" &&
      typeof f.required === "boolean" &&
      supported.includes(f.type as FormFieldType)
    );
  });
}
