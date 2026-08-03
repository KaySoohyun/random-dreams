import { describe, expect, it } from "vitest";
import { renderResultPdfClient } from "@/lib/pdf/client-pdf";

describe("renderResultPdfClient", () => {
  it("genera un Blob de tipo application/pdf con firma %PDF", async () => {
    const blob = await renderResultPdfClient("# Título\n\nTexto de prueba.");
    expect(blob.type).toBe("application/pdf");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(100);
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("%PDF");
  });
});
