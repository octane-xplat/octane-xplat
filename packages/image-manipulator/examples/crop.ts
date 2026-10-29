import { ImageManipulator, SaveFormat } from '@octane-xplat/image-manipulator'
import type { ImageResult } from '@octane-xplat/image-manipulator'

/** Accept the natural-image rectangle returned by image-crop's toNaturalCrop. */
export async function exportCrop(
	source: string,
	natural: { x: number; y: number; width: number; height: number },
): Promise<ImageResult> {
	const context = ImageManipulator.manipulate(source)
	let original: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	let cropped: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		original = await context.renderAsync()
		const originX = Math.max(0, Math.floor(natural.x))
		const originY = Math.max(0, Math.floor(natural.y))
		const width = Math.min(original.width - originX, Math.ceil(natural.x + natural.width) - originX)
		const height = Math.min(
			original.height - originY,
			Math.ceil(natural.y + natural.height) - originY,
		)
		context.crop({ originX, originY, width, height })
		cropped = await context.renderAsync()
		return await cropped.saveAsync({ format: SaveFormat.PNG })
	} finally {
		cropped?.release()
		original?.release()
		context.release()
	}
}
