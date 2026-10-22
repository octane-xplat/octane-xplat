import { expect, it } from 'vitest'
import { createImageBinding } from '../../image/src/image-binding'

function imageView() {
	return {
		src: undefined as string | undefined,
		getMeasuredWidth: () => 100,
		getMeasuredHeight: () => 100,
		on() {},
		off() {},
	}
}

it.fails('assigns the source to a replacement host when content fitting changes', () => {
	let fit: 'contain' | 'none' = 'contain'
	const binding = createImageBinding({
		getFit: () => fit,
		getPosition: () => ({}),
		getSrc: () => ({ source: 'avatar.png', sources: null }),
		getDecodeBounds: () => ({}),
		screenScale: () => 1,
	})
	const original = imageView()
	binding.update(original, null)
	expect(original.src).toBe('avatar.png')

	// Image replaces its host when changing to the computed content-rect path.
	fit = 'none'
	const replacement = imageView()
	try {
		binding.update(replacement, imageView())
		expect(replacement.src).toBe('avatar.png')
	} finally {
		binding.update(null, null)
	}
})
