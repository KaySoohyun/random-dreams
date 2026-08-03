import { NextResponse } from "next/server";
import { z } from "zod";
import { getResultFile, getResultFileName, getResultText } from "@/lib/services/generation";
import { renderResultPdf } from "@/lib/pdf/markdown-pdf";

export const runtime = "nodejs";

const formatoSchema = z.enum(["texto", "imagen", "pdf"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  let formato: z.infer<typeof formatoSchema>;
  let descarga = false;
  try {
    const url = new URL(_request.url);
    const parsed = formatoSchema.safeParse(url.searchParams.get("formato"));
    if (!parsed.success) return NextResponse.json({ error: "formato inválido" }, { status: 400 });
    formato = parsed.data;
    descarga = url.searchParams.get("descarga") === "1";
  } catch {
    return NextResponse.json({ error: "formato inválido" }, { status: 400 });
  }

  if (formato === "pdf") {
    const text = await getResultText(orderId);
    if (!text) {
      return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });
    }
    const pdfBytes = await renderResultPdf(text);
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${getResultFileName(orderId, "pdf") ?? "resultado.pdf"}"`
    );
    headers.set("Cache-Control", "no-store");
    return new NextResponse(new Uint8Array(pdfBytes), { headers });
  }

  const file = await getResultFile(orderId, formato);
  if (!file.found || !file.bytes) {
    return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", file.contentType ?? "application/octet-stream");
  if (descarga) {
    headers.set("Content-Disposition", `attachment; filename="${file.fileName}"`);
    headers.set("Cache-Control", "no-store");
  } else {
    headers.set("Cache-Control", "private, max-age=3600");
  }

  return new NextResponse(new Uint8Array(file.bytes), { headers });
}
