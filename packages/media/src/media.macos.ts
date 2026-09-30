// Media — AppKit host leaf. No picker or capture flow is wired on the
// desktop dev host.
import type { MediaImpl } from './types'

export const media: MediaImpl = {
	async ensure() { return 'unsupported' },
	async pickImage() { return null },
	async pickImages() { return [] },
	async capturePhoto() { return null },
}
