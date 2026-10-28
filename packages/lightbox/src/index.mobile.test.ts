import { expect, it, vi } from 'vitest'

vi.mock('@octane-xplat/ui', () => ({
	Overlay: () => null, Pressable: () => null, View: () => null, HStack: () => null, Text: () => null,
}))

it('native index exports the real surface under native platform resolution', async () => {
	const native = await import('./index.ts')
	for (const name of ['Lightbox', 'useLightbox', 'useLightboxState', 'Root', 'Trigger', 'Popup', 'Backdrop', 'Viewport', 'Slide', 'Image', 'Close', 'Prev', 'Next', 'Title', 'Description']) {
		expect(typeof (native as Record<string, unknown>)[name], name).toBe('function')
	}
})
