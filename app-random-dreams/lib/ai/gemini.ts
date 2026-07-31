import { GoogleGenAI } from "@google/genai";
import { interpolateTemplate } from "./interpolate";
import type { AIContentInput, AIContentProvider, GeneratedText } from "./types";

const MODEL = "gemini-flash-latest";
const TIMEOUT_MS = 30_000;

export class GeminiContentProvider implements AIContentProvider {
  constructor(
    private readonly apiKey: string | undefined = process.env.GEMINI_API_KEY,
    private readonly model: string = process.env.GEMINI_MODEL ?? MODEL
  ) {}

  async generate(input: AIContentInput): Promise<GeneratedText> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY no configurada");
    const ai = new GoogleGenAI({ apiKey: this.apiKey, httpOptions: { timeout: TIMEOUT_MS } });

    const textPrompt = interpolateTemplate(input.aiTextTemplate, input.formData);
    const imagePrompt = interpolateTemplate(input.aiPromptTemplate, input.formData);

    const response = await ai.models.generateContent({
      model: this.model,
      contents: textPrompt
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini devolvió texto vacío");

    return { text, imagePrompt };
  }
}
