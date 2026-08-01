import { describe, expect, it } from "vitest";
import { interpolateTemplate } from "@/lib/ai/interpolate";

describe("interpolateTemplate", () => {
  it("reemplaza los placeholders por sus valores", () => {
    expect(interpolateTemplate("Hola {nombre}, tu {tema}", { nombre: "Ana", tema: "sueño" })).toBe(
      "Hola Ana, tu sueño"
    );
  });

  it("une arrays con coma y espacio", () => {
    expect(interpolateTemplate("Animales: {animales}", { animales: ["León", "Águila"] })).toBe(
      "Animales: León, Águila"
    );
  });

  it("convierte números a string", () => {
    expect(interpolateTemplate("{anios} años", { anios: 5 })).toBe("5 años");
  });

  it("lanza error si falta el valor de un placeholder", () => {
    expect(() => interpolateTemplate("Hola {nombre}", {})).toThrow(
      "placeholder {nombre} sin valor"
    );
  });

  it("no toca texto sin placeholders", () => {
    expect(interpolateTemplate("Sin variables", {})).toBe("Sin variables");
  });
});
