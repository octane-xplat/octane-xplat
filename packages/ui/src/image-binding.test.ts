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

it('assigns the source to a replacement host when content fitting changes', () => {
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

it('deduplicates an unchanged host and waits for replacement layout', () => {
	const binding = createImageBinding({
		getFit: () => 'contain',
		getPosition: () => ({}),
		getSrc: () => ({ source: 'avatar.png', sources: null }),
		getDecodeBounds: () => ({}),
		screenScale: () => 1,
	})
	const original = imageView()
	let writes = 0
	Object.defineProperty(original, 'src', {
		set() {
			writes++
		},
	})
	binding.update(original, null)
	binding.update(original, null)
	expect(writes).toBe(1)
	binding.update(null, null)
	let width = 0
	const replacement = { ...imageView(), getMeasuredWidth: () => width }
	try {
		binding.update(replacement, null)
		expect(replacement.src).toBeUndefined()
		width = 100
		binding.update(replacement, null)
		expect(replacement.src).toBe('avatar.png')
	} finally {
		binding.update(null, null)
	}
})
