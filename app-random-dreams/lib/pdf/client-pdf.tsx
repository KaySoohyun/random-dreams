import { pdf } from "@react-pdf/renderer";
import { ResultDocument } from "./result-document";

export async function renderResultPdfClient(markdown: string): Promise<Blob> {
  const instance = pdf(<ResultDocument markdown={markdown} />);
  return instance.toBlob();
}
