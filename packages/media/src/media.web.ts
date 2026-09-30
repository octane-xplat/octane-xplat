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

async function imageRefs(selected: File[]): Promise<PickedImage[]> {
	// Finish every fallible read before allocating preview URLs. A failed batch
	// cannot return its successful siblings, so those need no retained previews.
	const dataUrls = await Promise.all(selected.map(readDataUrl))
	const refs: PickedImage[] = []
	try {
		for (const [index, file] of selected.entries()) {
			refs.push({ name: file.name, uri: URL.createObjectURL(file), dataUrl: dataUrls[index]! })
		}

		return refs
	} catch (error) {
		for (const ref of refs) {
			URL.revokeObjectURL(ref.uri)
		}

		throw error
	}
}

async function pickFiles(multiple: boolean): Promise<PickedImage[]> {
	return imageRefs(await selectFiles(multiple))
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

		const [image] = await imageRefs([file])
		return image ?? null
	},
	async ensure(kind: MediaPermissionKind): Promise<PermissionResult> {
		if (kind === 'photos') {
			return typeof document !== 'undefined' ? 'granted' : 'unsupported'
		}

		if (!navigator.permissions?.query) {
			return 'unsupported'
		}

		try {
			const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
			if (status.state === 'granted') {
				return 'granted'
			}

			return status.state === 'denied' ? 'denied' : 'unsupported'
		} catch {
			// Some browsers expose Permissions API but reject the camera descriptor.
			return 'unsupported'
		}
	},
}

// See media.ts — registers the kinds this leaf owns for the platform
// permissions dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => media.ensure('camera')
permissionOwners.photos = () => media.ensure('photos')
