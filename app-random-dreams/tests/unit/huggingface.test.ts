import { afterEach, describe, expect, it, vi } from "vitest";
import { HuggingFaceImageProvider } from "@/lib/ai/huggingface";
import { TransientAIError } from "@/lib/ai/types";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function imageResponse(bytes: number[], status = 200) {
  return new Response(new Uint8Array(bytes), {
    status,
    headers: { "Content-Type": "image/jpeg" }
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("HuggingFaceImageProvider", () => {
  it("lanza error si no hay HF_TOKEN configurada", async () => {
    const provider = new HuggingFaceImageProvider(undefined);
    await expect(provider.generate("prompt")).rejects.toThrow("HF_TOKEN no configurada");
  });

  it("devuelve los bytes directos de la respuesta binaria", async () => {
    fetchMock.mockResolvedValue(imageResponse([1, 2, 3]));

    const provider = new HuggingFaceImageProvider("tok");
    const buffer = await provider.generate("un gato");

    expect(buffer).toEqual(Buffer.from([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("flux"),
      expect.objectContaining({
        headers: { Authorization: "Bearer tok", "Content-Type": "application/json" }
      })
    );
  });

  it("descarga la imagen desde images[0].url si responde JSON", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ images: [{ url: "https://cdn/1.png" }] }))
      .mockResolvedValueOnce(imageResponse([9, 8, 7]));

    const provider = new HuggingFaceImageProvider("tok");
    const buffer = await provider.generate("prompt");

    expect(buffer).toEqual(Buffer.from([9, 8, 7]));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://cdn/1.png", expect.anything());
  });

  it("lanza error si la respuesta JSON no trae imágenes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "sin imágenes" }));

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("prompt")).rejects.toThrow("sin imágenes");
  });

  it("lanza TransientAIError en 429 y 5xx", async () => {
    fetchMock.mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 503 }));

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("p")).rejects.toBeInstanceOf(TransientAIError);
    await expect(provider.generate("p")).rejects.toBeInstanceOf(TransientAIError);
  });

  it("lanza Error genérico en otros códigos de error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }));

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("p")).rejects.toThrow("Hugging Face: error 400");
  });

  it("lanza error si la imagen binaria está vacía", async () => {
    fetchMock.mockResolvedValueOnce(imageResponse([], 200));

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("p")).rejects.toThrow("imagen vacía");
  });

  it("lanza TransientAIError si la descarga de la imagen falla", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ images: [{ url: "https://cdn/1.png" }] }))
      .mockResolvedValueOnce(new Response("no", { status: 404 }));

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("p")).rejects.toBeInstanceOf(TransientAIError);
  });

  it("lanza TransientAIError si el request se aborta por timeout", async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error("aborted"), { name: "AbortError" })
    );

    const provider = new HuggingFaceImageProvider("tok");
    await expect(provider.generate("p")).rejects.toBeInstanceOf(TransientAIError);
  });
});
