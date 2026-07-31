import { GeminiContentProvider } from "./gemini";
import { HuggingFaceImageProvider } from "./huggingface";
import { MockContentProvider, MockImageProvider } from "./mock";
import type { AIContentProvider, AIImageProvider } from "./types";

export function getContentProvider(): AIContentProvider {
  return process.env.AI_MOCK === "true" ? new MockContentProvider() : new GeminiContentProvider();
}

export function getImageProvider(): AIImageProvider {
  return process.env.AI_MOCK === "true" ? new MockImageProvider() : new HuggingFaceImageProvider();
}
