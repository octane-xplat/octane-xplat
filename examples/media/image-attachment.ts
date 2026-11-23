import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageManipulatorContext, ImageRef, ImageResult } from '@octane-xplat/image-manipulator'
import { MediaType, releaseAssetUri } from '@octane-xplat/media-library'
import type { Asset } from '@octane-xplat/media-library'

/** Return an app-temporary image for an upload or preview owner. */
export async function imageAttachment(asset: Asset): Promise<ImageResult> {
  // 1. Accept only a still image from the media library.
  if ((await asset.getMediaType()) !== MediaType.IMAGE) {
    throw new Error('Select a still image for this attachment')
  }

  // 2. Acquire the asset URI and prepare to release every resource.
  const uri = await asset.getUri()
  let context: ImageManipulatorContext | undefined
  let image: ImageRef | undefined

  try {
    // 3. Resize the image and save a temporary JPEG for the caller.
    context = ImageManipulator.manipulate(uri, { maxWidth: 1200, maxHeight: 1200 })
    image = await context.renderAsync()
    return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 })
  } finally {
    // 4. Release the image, context, and asset URI on every path.
    image?.release()
    context?.release()
    releaseAssetUri(uri)
  }
}
