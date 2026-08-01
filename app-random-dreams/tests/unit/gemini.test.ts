import { describe, expect, it, vi } from "vitest";

const generateContentMock = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  }
}));

import { GeminiContentProvider } from "@/lib/ai/gemini";

const input = {
  productId: "p1",
  formData: { nombre: "Martín", animal: "León" },
  aiTextTemplate: "Cuento para {nombre}",
  aiPromptTemplate: "Ilustración de {animal}"
};

describe("GeminiContentProvider", () => {
  it("lanza error si no hay api key", async () => {
    const provider = new GeminiContentProvider(undefined, "model");
    await expect(provider.generate(input)).rejects.toThrow("GEMINI_API_KEY no configurada");
  });

  it("interpola las plantillas y devuelve el texto e imagePrompt", async () => {
    generateContentMock.mockResolvedValue({ text: "  Un cuento bonito  " });

    const provider = new GeminiContentProvider("key", "model");
    const result = await provider.generate(input);

    expect(generateContentMock).toHaveBeenCalledWith({
      model: "model",
      contents: "Cuento para Martín"
    });
    expect(result.text).toBe("Un cuento bonito");
    expect(result.imagePrompt).toBe("Ilustración de León");
  });

  it("lanza error si Gemini devuelve texto vacío", async () => {
    generateContentMock.mockResolvedValue({ text: "   " });

    const provider = new GeminiContentProvider("key", "model");
    await expect(provider.generate(input)).rejects.toThrow("texto vacío");
  });

  it("lanza error si un placeholder no tiene valor en formData", async () => {
    generateContentMock.mockResolvedValue({ text: "x" });

    const provider = new GeminiContentProvider("key", "model");
    await expect(
      provider.generate({ ...input, formData: { nombre: "Martín" } })
    ).rejects.toThrow("placeholder {animal}");
  });
});
