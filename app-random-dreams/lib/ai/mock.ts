import { interpolateTemplate } from "./interpolate";
import type { AIContentInput, AIContentProvider, AIImageProvider, GeneratedText } from "./types";

const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export class MockContentProvider implements AIContentProvider {
  async generate(input: AIContentInput): Promise<GeneratedText> {
    const imagePrompt = interpolateTemplate(input.aiPromptTemplate, input.formData);
    const text = `[mock] Texto generado para ${input.productId}: ${imagePrompt}`;
    return { text, imagePrompt };
  }
}

export class MockImageProvider implements AIImageProvider {
  async generate(prompt: string): Promise<Buffer> {
    if (!prompt) throw new Error("Mock: prompt vacío");
    return ONE_PX_PNG;
  }
}
