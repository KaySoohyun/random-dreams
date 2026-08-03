export type ImageFormat = "png" | "jpg" | "bin";

export function detectImageFormat(bytes: Uint8Array): ImageFormat {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  return "bin";
}

export function imageFormatToMime(format: ImageFormat): string {
  if (format === "png") return "image/png";
  if (format === "jpg") return "image/jpeg";
  return "application/octet-stream";
}

export function imageBytesToDataUrl(bytes: Uint8Array): string {
  const format = detectImageFormat(bytes);
  const mime = imageFormatToMime(format);
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}
