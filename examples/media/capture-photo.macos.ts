import { media, type PickedImage } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

/** Bind capture to a button; dispose when this screen's owner ends. */
export function createStillPhotoAction(show: (image: PickedImage) => void) {
	let disposed = false
	let pending = false
	let current: PickedImage | null = null
	return {
		async capture() {
			if (disposed || pending) {
				return
			}

			pending = true
			try {
				const next = await media.capturePhoto({ saveToGallery: false })
				if (!next) {
					return
				} // Cancel or failure keeps the current preview.

				if (disposed) {
					files.release(next)
					return
				}

				if (current) {
					files.release(current)
				}

				current = next
				show(next)
			} finally {
				pending = false
			}
		},
		dispose() {
			disposed = true
			if (current) {
				files.release(current)
			}

			current = null
		},
	}
}
