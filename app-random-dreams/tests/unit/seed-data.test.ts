import { describe, expect, it } from "vitest";
import { products } from "../../prisma/seed-data";
import type { FormField } from "../../prisma/seed-data";

function fieldsOf(product: (typeof products)[number]): FormField[] {
  return (product.formSchema as { fields: FormField[] }).fields;
}

describe("seed de productos", () => {
  it("tiene exactamente 6 productos", () => {
    expect(products).toHaveLength(6);
  });

  it("tiene slugs y nombres únicos", () => {
    const slugs = products.map((p) => p.slug);
    const names = products.map((p) => p.name);
    expect(new Set(slugs).size).toBe(products.length);
    expect(new Set(names).size).toBe(products.length);
  });

  it("todos los productos definen plantillas de texto e imagen", () => {
    for (const product of products) {
      expect(product.aiTextTemplate.trim().length).toBeGreaterThan(20);
      expect(product.aiPromptTemplate.trim().length).toBeGreaterThan(20);
    }
  });

  it("las plantillas referencian solo campos existentes del formSchema", () => {
    for (const product of products) {
      const fieldNames = new Set(
        fieldsOf(product).map((field) => field.name)
      );
      const placeholders = [
        ...product.aiTextTemplate.matchAll(/\{(\w+)\}/g),
        ...product.aiPromptTemplate.matchAll(/\{(\w+)\}/g)
      ].map((m) => m[1]);
      for (const placeholder of placeholders) {
        expect(
          fieldNames.has(placeholder),
          `${product.slug}: placeholder {${placeholder}} sin campo en el formSchema`
        ).toBe(true);
      }
    }
  });

  it("los formSchema tienen campos con tipos soportados y select/multiselect con opciones", () => {
    const supported = ["text", "number", "select", "multiselect"];
    for (const product of products) {
      for (const field of fieldsOf(product)) {
        expect(supported, `${product.slug}: tipo ${field.type} no soportado`).toContain(
          field.type
        );
        if (field.type === "select" || field.type === "multiselect") {
          expect(
            Array.isArray(field.options) && (field.options?.length ?? 0) > 0,
            `${product.slug}: ${field.name} sin opciones`
          ).toBe(true);
        }
      }
    }
  });
});
