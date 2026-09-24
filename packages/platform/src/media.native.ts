// Media picking — store a temporary JPEG for NativeScript Image and return a
// data URL for APIs that persist image payloads.
import { create as createImagePicker } from '@nativescript/imagepicker'
// Ambient const enum — verbatimModuleSyntax forbids value access; Image = 1.
import type { ImagePickerMediaType } from '@nativescript/imagepicker'
import { ImageSource, knownFolders, path } from '@nativescript/core'
import { files } from './files'
import type { PickedImage } from './types'

export const media = {
	/** Opens the native image picker; returns null when permission is denied or selection is canceled. */
	async pickImage(): Promise<PickedImage | null> {
		const picker = createImagePicker({ mode: 'single', mediaType: 1 as ImagePickerMediaType })
		const permission = await picker.authorize()
		if (!permission.authorized) return null

		const [selection] = await picker.present()
		if (!selection) return null

		const source = await ImageSource.fromAsset(selection.asset)
		const filename = `octane-image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
		const uri = path.join(knownFolders.temp().path, filename)
		const ref = {
			name: selection.originalFilename || selection.filename || 'image.jpg',
			uri,
		}

		try {
			const saved = await source.saveToFileAsync(uri, 'jpeg', 85)
			if (!saved) throw new Error('Could not save the selected image to temporary storage')

			const base64 = await source.toBase64StringAsync('jpeg', 85)
			return { ...ref, dataUrl: `data:image/jpeg;base64,${base64}` }
		} catch (error) {
			files.release(ref)
			throw error
		}
	},
}
