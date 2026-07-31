import { z } from "zod";
import type { FormField, FormSchema } from "./types";

function buildFieldSchema(field: FormField): z.ZodTypeAny {
  const label = field.label;

  switch (field.type) {
    case "text": {
      let schema = z.string().trim();
      if (field.maxLength !== undefined) {
        schema = schema.max(field.maxLength, `${label} supera los ${field.maxLength} caracteres`);
      }
      if (field.required) {
        return schema.min(1, `${label} es obligatorio`);
      }
      return schema.optional().transform((value) => (value === "" ? undefined : value));
    }

    case "number": {
      const toNumber = (value: unknown) =>
        typeof value === "string" && value.trim() === "" ? undefined : Number(value);
      let number = z.number();
      if (field.min !== undefined) {
        number = number.min(field.min, `${label} debe ser ${field.min} o más`);
      }
      if (field.max !== undefined) {
        number = number.max(field.max, `${label} debe ser ${field.max} o menos`);
      }
      if (field.required) {
        return z.preprocess(toNumber, number);
      }
      return z.preprocess(toNumber, number.optional());
    }

    case "select": {
      const options = field.options ?? [];
      const valid = z
        .string()
        .refine((value) => options.includes(value), { message: `${label} es obligatorio` });
      if (field.required) {
        return valid;
      }
      return z.preprocess((value) => (value === "" ? undefined : value), valid.optional());
    }

    case "multiselect": {
      const options = field.options ?? [];
      const item = z.string().refine((value) => options.includes(value), {
        message: `Opción inválida en ${label}`
      });
      let array = z.array(item);
      if (field.min !== undefined) {
        array = array.min(field.min, `${label}: elegí al menos ${field.min}`);
      }
      if (field.max !== undefined) {
        array = array.max(field.max, `${label}: elegí como máximo ${field.max}`);
      }
      if (field.required && field.min === undefined) {
        array = array.min(1, `${label} es obligatorio`);
      }
      return z.preprocess((value) => {
        if (typeof value === "string") {
          return value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        }
        return value;
      }, array);
    }
  }
}

export function buildFormSchema(formSchema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of formSchema.fields) {
    shape[field.name] = buildFieldSchema(field);
  }
  return z.object(shape);
}

export function formDataToObject(
  formSchema: FormSchema,
  formData: FormData
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of formSchema.fields) {
    const value = formData.get(field.name);
    values[field.name] = typeof value === "string" ? value : "";
  }
  return values;
}

type ValidationOk = { success: true; data: Record<string, unknown> };
type ValidationError = { success: false; errors: Record<string, string> };

export function validateForm(
  formSchema: FormSchema,
  values: Record<string, unknown>
): ValidationOk | ValidationError {
  const result = buildFormSchema(formSchema).safeParse(values);
  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }
  const errors: Record<string, string> = {};
  const fieldErrors = result.error.flatten().fieldErrors;
  for (const key of Object.keys(fieldErrors)) {
    const messages = fieldErrors[key];
    if (messages && messages.length > 0) {
      errors[key] = messages[0];
    }
  }
  return { success: false, errors };
}
