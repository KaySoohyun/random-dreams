import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/generation", () => ({
  getResultFile: vi.fn()
}));

import { GET } from "@/app/api/resultado/[orderId]/route";
import { getResultFile } from "@/lib/services/generation";

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

    const invalid = await get("http://localhost/api/resultado/ord_1?formato=pdf");
    expect(invalid.status).toBe(400);
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
