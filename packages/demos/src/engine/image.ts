// Shared fallback for image.web.ts / image.mobile.ts.
// DecodedImage is the minimal contract the engines need; each platform
// returns its own concrete bitmap (DOM ImageBitmap or canvas ImageBitmap).
export type DecodedImage = { width: number; height: number }

export async function decodeImageBytes(_bytes: Uint8Array, _mimeType: string): Promise<DecodedImage> {
  throw new Error('engine demo: image decode unsupported on this platform')
}
