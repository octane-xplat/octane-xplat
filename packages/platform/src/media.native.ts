// Media picking — store a temporary JPEG for NativeScript Image and return a
// data URL for APIs that persist image payloads.
import { create as createImagePicker } from '@nativescript/imagepicker'
// Ambient const enum — verbatimModuleSyntax forbids value access; Image = 1.
import type { ImagePickerMediaType } from '@nativescript/imagepicker'
import { ImageSource, knownFolders, path } from '@nativescript/core'
import { files } from './files'
import type { MediaImpl, MediaPermissionKind, PermissionResult, PickedImage } from './types'

async function ensurePhotos(): Promise<PermissionResult> {
	try {
		const picker = createImagePicker({ mode: 'single', mediaType: 1 as ImagePickerMediaType })
		const permission = (await picker.authorize()) as { authorized?: boolean } | boolean
		return permission === true || (typeof permission === 'object' && permission.authorized === true)
			? 'granted'
			: 'denied'
	} catch {
		return 'denied'
	}
}

async function pickSelections(mode: 'single' | 'multiple'): Promise<PickedImage[]> {
	const picker = createImagePicker({ mode, mediaType: 1 as ImagePickerMediaType })
	const permission = (await picker.authorize()) as { authorized?: boolean } | boolean
	if (
		!(permission === true || (typeof permission === 'object' && permission.authorized === true))
	) {
		return []
	}

	const selections = await picker.present()
	const refs: PickedImage[] = []
	try {
		for (const selection of selections) {
			const source = await ImageSource.fromAsset(selection.asset)
			const filename = `octane-image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
			const uri = path.join(knownFolders.temp().path, filename)
			const ref = {
				name: selection.originalFilename || selection.filename || 'image.jpg',
				uri,
			}

			const saved = await source.saveToFileAsync(uri, 'jpeg', 85)
			if (!saved) {
				throw new Error('Could not save the selected image to temporary storage')
			}

			const base64 = await source.toBase64StringAsync('jpeg', 85)
			refs.push({ ...ref, dataUrl: `data:image/jpeg;base64,${base64}` })
		}

		return refs
	} catch (error) {
		for (const ref of refs) {
			files.release(ref)
		}

		throw error
	}
}

export const media: MediaImpl = {
	/** Opens the native image picker; returns null when canceled. */
	async pickImage(): Promise<PickedImage | null> {
		const [image] = await pickSelections('single')
		return image ?? null
	},
	/** Opens the native image picker in multiple-selection mode. */
	pickImages() {
		return pickSelections('multiple')
	},
	async ensure(kind: MediaPermissionKind): Promise<PermissionResult> {
		return kind === 'photos' ? ensurePhotos() : 'unsupported'
	},
}
