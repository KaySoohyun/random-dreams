import { describe, expect, it } from "vitest";
import { formDataToObject, validateForm } from "@/features/forms/build-form-schema";
import type { FormSchema } from "@/features/forms/types";

const schema: FormSchema = {
  fields: [
    { name: "nombre", label: "Tu nombre", type: "text", required: true, maxLength: 10 },
    { name: "apodo", label: "Apodo (opcional)", type: "text", required: false, maxLength: 20 },
    { name: "anios", label: "Años", type: "number", required: false, min: 1, max: 60 },
    { name: "estilo", label: "Estilo", type: "select", required: true, options: ["A", "B"] },
    { name: "animales", label: "Animales", type: "multiselect", required: true, min: 2, max: 3, options: ["León", "Águila"] }
  ]
};

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("validateForm", () => {
  it("valida un formulario completo y devuelve los datos", () => {
    const result = validateForm(schema, {
      nombre: "  Martín  ",
      apodo: "",
      anios: "10",
      estilo: "A",
      animales: ["León", "Águila"]
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe("Martín");
      expect(result.data.apodo).toBeUndefined();
      expect(result.data.anios).toBe(10);
      expect(result.data.animales).toEqual(["León", "Águila"]);
    }
  });

  it("reporta errores por campo con el mensaje del campo", () => {
    const result = validateForm(schema, {
      nombre: "",
      anios: "0",
      estilo: "A",
      animales: ["León"]
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.nombre).toContain("obligatorio");
      expect(result.errors.anios).toContain("1");
      expect(result.errors.animales).toContain("2");
    }
  });

  it("rechaza una opción inválida en select", () => {
    const result = validateForm(schema, {
      nombre: "Martín",
      estilo: "No existe",
      animales: ["León", "Águila"]
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.estilo).toBeDefined();
    }
  });

  it("respeta maxLength en text", () => {
    const result = validateForm(schema, {
      nombre: "abcdefghijklmnop",
      estilo: "A",
      animales: ["León", "Águila"]
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.nombre).toContain("10");
    }
  });

  it("multiselect opcional con valores vacíos se convierte en lista vacía válida", () => {
    const optional: FormSchema = {
      fields: [
        { name: "extras", label: "Extras", type: "multiselect", required: false, options: ["X"] }
      ]
    };
    const result = validateForm(optional, { extras: [] });
    expect(result.success).toBe(true);
  });
});

describe("formDataToObject", () => {
  it("convierte FormData a objeto plano de strings", () => {
    const obj = formDataToObject(schema, formData({ nombre: "Martín", estilo: "A" }));
    expect(obj).toEqual({ nombre: "Martín", apodo: "", anios: "", estilo: "A", animales: "" });
  });
});
