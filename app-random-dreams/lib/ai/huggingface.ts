import { TransientAIError } from "./types";
import type { AIImageProvider } from "./types";

const FLUX_URL = "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell";
const TIMEOUT_MS = 120_000;

export class HuggingFaceImageProvider implements AIImageProvider {
  constructor(
    private readonly token: string | undefined = process.env.HF_TOKEN
  ) {}

  async generate(prompt: string): Promise<Buffer> {
    if (!this.token) throw new Error("HF_TOKEN no configurada");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(FLUX_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });

      if (response.status === 429 || response.status >= 500) {
        throw new TransientAIError(`Hugging Face: error transitorio ${response.status}`);
      }
      if (!response.ok) {
        throw new Error(`Hugging Face: error ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = (await response.json()) as {
          images?: Array<{ url?: string }>;
          error?: string;
        };
        const imageUrl = json.images?.[0]?.url;
        if (!imageUrl) throw new Error(json.error ?? "Hugging Face: respuesta sin imágenes");

        const imageResponse = await fetch(imageUrl, { signal: controller.signal });
        if (!imageResponse.ok) {
          throw new TransientAIError(
            `Hugging Face: error al descargar imagen ${imageResponse.status}`
          );
        }
        return Buffer.from(await imageResponse.arrayBuffer());
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) throw new Error("Hugging Face devolvió imagen vacía");
      return bytes;
    } catch (error) {
      if (error instanceof TransientAIError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new TransientAIError("Hugging Face: timeout", { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
