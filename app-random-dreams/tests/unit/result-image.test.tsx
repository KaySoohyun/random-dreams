import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageUnavailable, ResultImage } from "@/features/result/result-image";

describe("ResultImage", () => {
  it("muestra un spinner mientras la imagen carga", () => {
    render(<ResultImage src="/api/x" alt="Imagen" />);
    expect(screen.getByRole("status", { name: "Cargando imagen" })).toBeTruthy();
  });

  it("esconde el spinner cuando la imagen carga", () => {
    render(<ResultImage src="/api/x" alt="Imagen" />);
    fireEvent.load(screen.getByAltText("Imagen"));
    expect(screen.queryByRole("status", { name: "Cargando imagen" })).toBeNull();
  });

  it("muestra el aviso 'Imagen no disponible' si el onError dispara", () => {
    render(<ResultImage src="/api/x" alt="Imagen" />);
    fireEvent.error(screen.getByAltText("Imagen"));
    expect(screen.getByText("Imagen no disponible")).toBeTruthy();
  });

  it("ImageUnavailable muestra el aviso 'Imagen no disponible'", () => {
    render(<ImageUnavailable />);
    expect(screen.getByText("Imagen no disponible")).toBeTruthy();
  });
});
