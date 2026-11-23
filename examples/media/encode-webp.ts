import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageRef, ImageResult } from '@octane-xplat/image-manipulator'

/** The receiving owner releases the returned temporary result after use. */
export async function toWebP(sourceUri: string): Promise<ImageResult> {
  // 1. Open the source in an image context.
  const context = ImageManipulator.manipulate(sourceUri)
  let image: ImageRef | undefined

  try {
    // 2. Render and save a temporary WebP for the caller to release.
    image = await context.renderAsync()
    return await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.8 })
  } finally {
    // 3. Release the rendered pixels and context even when saving fails.
    image?.release()
    context.release()
  }
}
