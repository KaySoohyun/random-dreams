import { pdf } from "@react-pdf/renderer";
import { ResultDocument } from "./result-document";

export async function renderResultPdfClient(
  markdown: string,
  logo?: string
): Promise<Blob> {
  const instance = pdf(<ResultDocument markdown={markdown} logo={logo} />);
  return instance.toBlob();
}
