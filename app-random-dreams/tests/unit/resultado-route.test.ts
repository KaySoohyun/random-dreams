import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/generation", () => ({
  getResultFile: vi.fn(),
  getResultFileName: vi.fn(),
  getResultText: vi.fn()
}));

vi.mock("@/lib/pdf/markdown-pdf", () => ({
  renderResultPdf: vi.fn()
}));

import { GET } from "@/app/api/resultado/[orderId]/route";
import { getResultFile, getResultFileName, getResultText } from "@/lib/services/generation";
import { renderResultPdf } from "@/lib/pdf/markdown-pdf";

async function get(url: string) {
  return GET(new Request(url), { params: Promise.resolve({ orderId: "ord_1" }) });
}

describe("GET /api/resultado/[orderId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 si el formato es inválido o falta", async () => {
    const response = await get("http://localhost/api/resultado/ord_1");
    expect(response.status).toBe(400);

    const invalid = await get("http://localhost/api/resultado/ord_1?formato=json");
    expect(invalid.status).toBe(400);
  });

  it("devuelve 404 en pdf si no hay texto", async () => {
    vi.mocked(getResultText).mockResolvedValue(null);

    const response = await get("http://localhost/api/resultado/ord_1?formato=pdf");
    expect(response.status).toBe(404);
  });

  it("devuelve el pdf con content-type application/pdf", async () => {
    vi.mocked(getResultText).mockResolvedValue("# Título\n\nTexto.");
    vi.mocked(getResultFileName).mockReturnValue("souvenir-de-vida-paralela-sofia-2026-08-03.pdf");
    vi.mocked(renderResultPdf).mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

    const response = await get("http://localhost/api/resultado/ord_1?formato=pdf");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="souvenir-de-vida-paralela-sofia-2026-08-03.pdf"'
    );
    const body = Buffer.from(await response.arrayBuffer());
    expect([...body]).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it("usa resultado.pdf como fallback si no se puede derivar el nombre del pdf", async () => {
    vi.mocked(getResultText).mockResolvedValue("# Título");
    vi.mocked(getResultFileName).mockReturnValue(null);
    vi.mocked(renderResultPdf).mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

    const response = await get("http://localhost/api/resultado/ord_1?formato=pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="resultado.pdf"'
    );
  });

  it("devuelve 404 si no hay resultado o faltan bytes", async () => {
    vi.mocked(getResultFile).mockResolvedValue({ found: false });

    const response = await get("http://localhost/api/resultado/ord_1?formato=texto");
    expect(response.status).toBe(404);

    vi.mocked(getResultFile).mockResolvedValue({
      found: true,
      fileName: "resultado.txt",
      bytes: undefined as never
    });
    const noBytes = await get("http://localhost/api/resultado/ord_1?formato=texto");
    expect(noBytes.status).toBe(404);
  });

  it("devuelve el texto con content-type text/plain", async () => {
    vi.mocked(getResultFile).mockResolvedValue({
      found: true,
      fileName: "resultado.txt",
      contentType: "text/plain; charset=utf-8",
      bytes: new TextEncoder().encode("hola")
    });

    const response = await get("http://localhost/api/resultado/ord_1?formato=texto");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe("hola");
  });

  it("con descarga=1 agrega Content-Disposition y no cachea", async () => {
    vi.mocked(getResultFile).mockResolvedValue({
      found: true,
      fileName: "resultado.txt",
      contentType: "text/plain; charset=utf-8",
      bytes: new TextEncoder().encode("hola")
    });

    const response = await get(
      "http://localhost/api/resultado/ord_1?formato=texto&descarga=1"
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="resultado.txt"'
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("sin descarga cachea la vista previa", async () => {
    vi.mocked(getResultFile).mockResolvedValue({
      found: true,
      fileName: "resultado.txt",
      contentType: "text/plain; charset=utf-8",
      bytes: new TextEncoder().encode("hola")
    });

    const response = await get("http://localhost/api/resultado/ord_1?formato=texto");
    expect(response.headers.get("cache-control")).toBe("private, max-age=3600");
    expect(response.headers.get("content-disposition")).toBeNull();
  });

  it("devuelve la imagen con content-type derivado", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    vi.mocked(getResultFile).mockResolvedValue({
      found: true,
      fileName: "resultado.png",
      contentType: "image/png",
      bytes: new Uint8Array(png)
    });

    const response = await get("http://localhost/api/resultado/ord_1?formato=imagen");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const body = Buffer.from(await response.arrayBuffer());
    expect([...body]).toEqual([...png]);
  });
});
