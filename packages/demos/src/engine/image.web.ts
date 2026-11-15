// Web: embedded glTF images decode through the standard
// Blob -> createImageBitmap path.
export type DecodedImage = { width: number; height: number }

export async function decodeImageBytes(bytes: Uint8Array, mimeType: string): Promise<DecodedImage> {
  const blob = new Blob([bytes as BlobPart], { type: mimeType })
  return createImageBitmap(blob)
}
