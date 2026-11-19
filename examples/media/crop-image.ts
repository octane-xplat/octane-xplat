import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageRef, ImageResult } from '@octane-xplat/image-manipulator'

/** Accept the natural-image rectangle returned by image-crop's toNaturalCrop. */
export async function exportCrop(
  source: string,
  natural: { x: number; y: number; width: number; height: number },
): Promise<ImageResult> {
  // 1. Create a context for the source image.
  const context = ImageManipulator.manipulate(source)
  let original: ImageRef | undefined
  let cropped: ImageRef | undefined

  try {
    // 2. Render the source to find its natural pixel dimensions.
    original = await context.renderAsync()

    const originX = Math.max(0, Math.floor(natural.x))
    const originY = Math.max(0, Math.floor(natural.y))
    const width = Math.min(original.width - originX, Math.ceil(natural.x + natural.width) - originX)
    const height = Math.min(
      original.height - originY,
      Math.ceil(natural.y + natural.height) - originY,
    )

    // 3. Crop the calculated selection and save it as a PNG.
    context.crop({ originX, originY, width, height })
    cropped = await context.renderAsync()
    return await cropped.saveAsync({ format: SaveFormat.PNG })
  } finally {
    // 4. Release the rendered images and context on success or failure.
    cropped?.release()
    original?.release()
    context.release()
  }
}
