// Media picking — web leaf. Keep an object URL for previews and a data URL for
// APIs that persist image payloads. The file input supports multiple photos.
import type {
	CapturePhotoOptions,
	MediaImpl,
	MediaPermissionKind,
	PermissionResult,
	PickedImage,
} from './types'

function selectFiles(multiple: boolean, capture?: 'user' | 'environment'): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.multiple = multiple
		if (capture) {
			input.capture = capture
		}

		input.onchange = () => resolve(Array.from(input.files ?? []))
		input.oncancel = () => resolve([])
		input.click()
	})
}

function readDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result)
			} else {
				reject(new Error('Could not read the selected image'))
			}
		}

		reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected image'))

		reader.readAsDataURL(file)
	})
}

async function pickFiles(multiple: boolean): Promise<PickedImage[]> {
	const selected = await selectFiles(multiple)
	return Promise.all(
		selected.map(async (file) => ({
			name: file.name,
			uri: URL.createObjectURL(file),
			dataUrl: await readDataUrl(file),
		})),
	)
}

export const media: MediaImpl = {
	/** Opens the browser image picker; returns null when selection is canceled. */
	async pickImage(): Promise<PickedImage | null> {
		const [image] = await pickFiles(false)
		return image ?? null
	},
	/** Opens the browser image picker with multiple selection enabled. */
	pickImages() {
		return pickFiles(true)
	},
	/**
	 * Requests a camera shot via `<input type="file" capture>`. Mobile browsers
	 * open the camera UI; desktop browsers fall back to the file picker —
	 * there is no headless still-capture API without a rendered viewfinder.
	 * `width`/`height`/`keepAspectRatio`/`saveToGallery` have no web meaning
	 * and are ignored.
	 */
	async capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null> {
		const facing = options?.cameraFacing === 'front' ? 'user' : 'environment'
		const [file] = await selectFiles(false, facing)
		if (!file) {
			return null
		}

		return { name: file.name, uri: URL.createObjectURL(file), dataUrl: await readDataUrl(file) }
	},
	async ensure(kind: MediaPermissionKind): Promise<PermissionResult> {
		if (kind === 'photos') {
			return typeof document !== 'undefined' ? 'granted' : 'unsupported'
		}

		if (!navigator.mediaDevices?.getUserMedia) {
			return 'unsupported'
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true })
			stream.getTracks().forEach((track) => track.stop())
			return 'granted'
		} catch {
			return 'denied'
		}
	},
}
