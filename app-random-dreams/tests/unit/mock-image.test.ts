import { afterEach, describe, expect, it } from "vitest";
import { MockContentProvider, MockImageProvider } from "@/lib/ai/mock";

afterEach(() => {
  delete process.env.AI_IMAGE_OK;
});

describe("MockContentProvider", () => {
  it("avisa que el texto no se generó en modo local", async () => {
    const result = await new MockContentProvider().generate({
      productId: "manual-de-contingencia-absurda",
      formData: { ciudad: "luna" },
      aiTextTemplate: "Escribe un manual de {ciudad}",
      aiPromptTemplate: "Ilustra un mapa de {ciudad}"
    });
    expect(result.text).toContain("[mock]");
    expect(result.text).toContain("El texto no se generó");
    expect(result.text).toContain("AI_MOCK=true");
  });
});

describe("MockImageProvider", () => {
  it("lanza error por defecto (imagen no disponible, prueba el aviso)", async () => {
    await expect(new MockImageProvider().generate("prompt")).rejects.toThrow(
      "Mock: imagen no disponible"
    );
  });

  it("devuelve un PNG placeholder válido cuando AI_IMAGE_OK=true", async () => {
    process.env.AI_IMAGE_OK = "true";
    const buffer = await new MockImageProvider().generate("prompt");
    const png = new Uint8Array(buffer);
    expect(png.subarray(0, 8)).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    );
    expect(png.length).toBeGreaterThan(1000);
  });
});
