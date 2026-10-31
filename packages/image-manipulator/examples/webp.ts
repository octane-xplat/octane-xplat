import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'

/** The receiving owner releases the returned temporary result after use. */
export async function toWebP(sourceUri: string): Promise<ImageResult> {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		image = await context.renderAsync()
		return await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}
