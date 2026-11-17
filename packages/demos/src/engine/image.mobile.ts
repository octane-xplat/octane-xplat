// Native image decode for embedded GLB images.
//
// ImageBitmap.createFrom(bytes) routes through the plugin's async
// createImageBitmap worker path, which has been observed to never settle on
// iOS (5 decodes issued, 0 completions in 40s). ImageAsset's synchronous
// fromEncodedBytesSync decodes PNG/JPEG on the JS thread instead; wrapping
// the loaded asset in ImageBitmap.createFrom(asset) then only converts
// asset -> bitmap. If the async machinery is what is actually broken the
// fallback logs make that visible.
import { ImageAsset, ImageBitmap } from '@nativescript/canvas'

export type DecodedImage = { width: number; height: number }

export async function decodeImageBytes(bytes: Uint8Array, _mimeType: string): Promise<DecodedImage> {
  const asset = new ImageAsset()
  const ok = asset.loadFromEncodedBytesSync(bytes) as boolean
  console.log(`[engine-demo] image decode sync ok=${ok} ${asset.width}x${asset.height}`)
  if (!ok) {
    throw new Error(`image decode failed (fromEncodedBytesSync): ${asset.error ?? 'unknown'}`)
  }
  return ImageBitmap.createFrom(asset)
}
