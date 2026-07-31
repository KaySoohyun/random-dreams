import { afterEach, describe, expect, it } from "vitest";
import { getContentProvider, getImageProvider } from "@/lib/ai/factory";
import { GeminiContentProvider } from "@/lib/ai/gemini";
import { HuggingFaceImageProvider } from "@/lib/ai/huggingface";
import { MockContentProvider, MockImageProvider } from "@/lib/ai/mock";

const original = process.env.AI_MOCK;

afterEach(() => {
  if (original === undefined) delete process.env.AI_MOCK;
  else process.env.AI_MOCK = original;
});

describe("fábrica de proveedores de IA", () => {
  it("devuelve mocks con AI_MOCK=true", () => {
    process.env.AI_MOCK = "true";
    expect(getContentProvider()).toBeInstanceOf(MockContentProvider);
    expect(getImageProvider()).toBeInstanceOf(MockImageProvider);
  });

  it("devuelve los proveedores reales sin AI_MOCK", () => {
    delete process.env.AI_MOCK;
    expect(getContentProvider()).toBeInstanceOf(GeminiContentProvider);
    expect(getImageProvider()).toBeInstanceOf(HuggingFaceImageProvider);
  });
});
