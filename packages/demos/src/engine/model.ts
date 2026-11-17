// Shared fallback for model.web.ts / model.mobile.ts — reached only on
// platforms without an engine host (macOS, Windows).
export async function readModelBytes(): Promise<ArrayBuffer> {
  throw new Error('engine demo: model loading unsupported on this platform')
}
