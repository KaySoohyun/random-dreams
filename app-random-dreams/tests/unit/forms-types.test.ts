import { describe, expect, it } from "vitest";
import { isFormSchema } from "@/features/forms/types";
import type { FormField } from "@/features/forms/types";

describe("isFormSchema", () => {
  it("acepta un schema válido con todos los tipos soportados", () => {
    for (const type of ["text", "number", "select", "multiselect"]) {
      const schema: FormSchema = {
        fields: [{ name: "x", label: "X", type: type as FormField["type"], required: true }]
      };
      expect(isFormSchema(schema)).toBe(true);
    }
  });

  it("acepta un schema con campos vacíos", () => {
    expect(isFormSchema({ fields: [] })).toBe(true);
  });

  it("rechaza null, undefined y no-objetos", () => {
    expect(isFormSchema(null)).toBe(false);
    expect(isFormSchema(undefined)).toBe(false);
    expect(isFormSchema("texto")).toBe(false);
    expect(isFormSchema(42)).toBe(false);
  });

  it("rechaza schemas sin array de fields", () => {
    expect(isFormSchema({})).toBe(false);
    expect(isFormSchema({ fields: "no-array" })).toBe(false);
    expect(isFormSchema({ fields: [{}] })).toBe(false);
  });

  it("rechaza tipos de campo no soportados", () => {
    expect(isFormSchema({ fields: [{ name: "x", label: "X", type: "email", required: true }] })).toBe(
      false
    );
  });

  it("rechaza campos con propiedades obligatorias faltantes", () => {
    expect(isFormSchema({ fields: [{ name: "x", label: "X", required: true }] })).toBe(false);
    expect(isFormSchema({ fields: [{ name: "x", type: "text", required: true }] })).toBe(false);
    expect(isFormSchema({ fields: [{ name: "x", label: "X", type: "text" }] })).toBe(false);
  });
});
