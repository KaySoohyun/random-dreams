export type AIContentInput = {
  productId: string;
  formData: Record<string, unknown>;
  aiTextTemplate: string;
  aiPromptTemplate: string;
};

export type GeneratedText = {
  text: string;
  imagePrompt: string;
};

export interface AIContentProvider {
  generate(input: AIContentInput): Promise<GeneratedText>;
}

export interface AIImageProvider {
  generate(prompt: string): Promise<Buffer>;
}

export class TransientAIError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TransientAIError";
  }
}
