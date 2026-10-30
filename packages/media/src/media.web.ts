// Media picking — web leaf. The picked File gets a blob: object URL — a file
// handle that previews via `Image.src` and uploads via `files.readBytes`;
// no inline data URL is produced. The file input supports multiple photos.
import type { PermissionResponse, Service } from '@octane-xplat/lib/capability'
import type { CapturePhotoOptions, MediaImpl, MediaPermissionKind, PickedImage } from './types'

function selectFiles(multiple: boolean, capture?: 'user' | 'environment'): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.multiple = multiple
		if (capture) {
			input.capture = capture
		}

		let settled = false
		const settle = (files: File[]) => {
			if (settled) {
				return
			}

			settled = true
			input.onchange = null
			input.oncancel = null
			if (typeof window !== 'undefined') {
				window.removeEventListener('focus', onFocus)
			}

			resolve(files)
		}

		// Browsers without input.oncancel still return focus to the page when
		// the picker dismisses — wait a beat for a trailing change event.
		const onFocus = () => {
			setTimeout(() => settle(Array.from(input.files ?? [])), 350)
		}

		input.onchange = () => settle(Array.from(input.files ?? []))
		input.oncancel = () => settle([])
		if (typeof window !== 'undefined') {
			window.addEventListener('focus', onFocus)
		}

		input.click()
	})
}

async function imageRefs(selected: File[]): Promise<PickedImage[]> {
	const refs: PickedImage[] = []
	try {
		for (const file of selected) {
			refs.push({ name: file.name, uri: URL.createObjectURL(file) })
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

const respond = (): PermissionResponse =>
	typeof document !== 'undefined'
		? { status: 'granted', granted: true, canAskAgain: true }
		: { status: 'unsupported', granted: false, canAskAgain: false }

/** Media service — gallery picking and still capture. See MediaImpl. */
export const media: Service<MediaImpl> = {
	supported: typeof document !== 'undefined',
	isAvailable: async () => typeof document !== 'undefined',
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

		// Non-cancel failures resolve null on every leaf — a shared caller
		// never has to catch a read or persistence failure here.
		try {
			const [image] = await imageRefs([file])
			return image ?? null
		} catch {
			return null
		}
	},
	// The file-input path needs no camera or photos permission — report the
	// capability the leaf actually delivers.
	async getPermissions(_kind: MediaPermissionKind): Promise<PermissionResponse> {
		return respond()
	},
	async requestPermissions(_kind: MediaPermissionKind): Promise<PermissionResponse> {
		return respond()
	},
}

// See media.ts — registers the kinds this leaf owns for the platform
// permissions dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = {
	getPermissions: () => media.getPermissions('camera'),
	requestPermissions: () => media.requestPermissions('camera'),
}

permissionOwners.photos = {
	getPermissions: () => media.getPermissions('photos'),
	requestPermissions: () => media.requestPermissions('photos'),
}
