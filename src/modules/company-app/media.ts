const TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;

/** Keep active formats (HTML/SVG) out of first-party media responses. */
export function validateMedia(bytes: Uint8Array, claimedType: string): { extension: string; contentType: string } {
  const ascii = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
  let detected = "";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) detected = "image/png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) detected = "image/jpeg";
  else if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") detected = "image/webp";
  else if (ascii(4, 8) === "ftyp") detected = "video/mp4";
  else if ([26, 69, 223, 163].every((byte, i) => bytes[i] === byte) && ascii(0, 4096).includes("webm")) detected = "video/webm";
  if (!detected || detected !== claimedType) throw new Error("Choose a PNG, JPEG, WebP, MP4 or WebM file with matching contents.");
  const maximum = detected.startsWith("image/") ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
  if (bytes.length > maximum) throw new Error("Images can be up to 10 MB and videos up to 25 MB.");
  return { extension: TYPES[detected as keyof typeof TYPES], contentType: detected };
}

export function managedMediaContentType(asset: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|mp4|webm)$/.test(asset)) return null;
  return Object.entries(TYPES).find(([, ext]) => asset.endsWith(`.${ext}`))?.[0] ?? null;
}
