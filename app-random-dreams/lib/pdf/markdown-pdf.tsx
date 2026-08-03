import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultDocument } from "./result-document";

async function readLogoDataUri(): Promise<string | undefined> {
  try {
    const bytes = await readFile(join(process.cwd(), "public/assets/logo_pdf.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function renderResultPdf(markdown: string): Promise<Uint8Array> {
  const logo = await readLogoDataUri();
  const buffer = await renderToBuffer(<ResultDocument markdown={markdown} logo={logo} />);
  return new Uint8Array(buffer);
}
