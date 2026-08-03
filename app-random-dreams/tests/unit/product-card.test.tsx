import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/features/catalog/product-card";
import type { CatalogProduct } from "@/lib/data/products";

const product: CatalogProduct = {
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
  sortOrder: 1
};

describe("ProductCard", () => {
  it("muestra el nombre y el tagline", () => {
    render(<ProductCard product={product} />);
    expect(
      screen.getByRole("heading", { name: "Souvenir de Vida Paralela" })
    ).toBeTruthy();
    expect(screen.getByText("Tu vida en otro universo")).toBeTruthy();
  });

  it("enlaza toda la card a la ficha del producto por slug", () => {
    render(<ProductCard product={product} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(
      "/producto/souvenir-de-vida-paralela"
    );
  });
});
