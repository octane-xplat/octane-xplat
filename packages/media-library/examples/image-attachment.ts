import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'
import { MediaType, releaseAssetUri } from '@octane-xplat/media-library'
import type { Asset } from '@octane-xplat/media-library'

/** Return an app-temporary image for an upload or preview owner. */
export async function imageAttachment(asset: Asset): Promise<ImageResult> {
	if ((await asset.getMediaType()) !== MediaType.IMAGE) {
		throw new Error('Select a still image for this attachment')
	}
	const uri = await asset.getUri()
	let context: ReturnType<typeof ImageManipulator.manipulate> | undefined
	let image:
		| Awaited<ReturnType<ReturnType<typeof ImageManipulator.manipulate>['renderAsync']>>
		| undefined
	try {
		context = ImageManipulator.manipulate(uri, { maxWidth: 1200, maxHeight: 1200 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 })
	} finally {
		image?.release()
		context?.release()
		releaseAssetUri(uri)
	}
}
