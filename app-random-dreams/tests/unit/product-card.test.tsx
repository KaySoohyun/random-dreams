import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/features/catalog/product-card";
import type { ProductModel } from "@/lib/generated/prisma/models";

const product: ProductModel = {
  id: "p1",
  slug: "souvenir-de-vida-paralela",
  name: "Souvenir de Vida Paralela",
  tagline: "Tu vida en otro universo",
  description: "descripción",
  formSchema: { fields: [] },
  aiTextTemplate: "plantilla",
  aiPromptTemplate: "plantilla",
  imageUrl: null,
  active: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe("ProductCard", () => {
  it("muestra el nombre, el tagline y el CTA", () => {
    render(<ProductCard product={product} />);
    expect(
      screen.getByRole("heading", { name: "Souvenir de Vida Paralela" })
    ).toBeTruthy();
    expect(screen.getByText("Tu vida en otro universo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Crear" })).toBeTruthy();
  });

  it("enlaza a la ficha del producto por slug", () => {
    render(<ProductCard product={product} />);
    const link = screen.getByRole("link", { name: "Crear" });
    expect(link.getAttribute("href")).toBe("/producto/souvenir-de-vida-paralela");
  });
});
