// Media picking — web leaf. Keep an object URL for previews and a data URL for
// APIs that persist image payloads. Multi-select stays out of v1.
import type { PickedImage } from './types'
import { files } from './files'

export const media = {
	/** Opens the browser image picker; returns null when selection is canceled. */
	async pickImage(): Promise<PickedImage | null> {
		const file = await files.pick('image/*')
		if (!file) return null

		try {
			const blob = await (await fetch(file.uri)).blob()
			const dataUrl = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = () => {
					if (typeof reader.result === 'string') resolve(reader.result)
					else reject(new Error('Could not read the selected image'))
				}

				reader.onerror = () =>
					reject(reader.error ?? new Error('Could not read the selected image'))

				reader.readAsDataURL(blob)
			})

			return { ...file, dataUrl }
		} catch (error) {
			files.release(file)
			throw error
		}
	},
}
