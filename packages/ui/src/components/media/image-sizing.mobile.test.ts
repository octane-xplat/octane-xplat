import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSizedImageBinding } from './image-sizing'

afterEach(() => {
	vi.useRealTimers()
})

function mockView(width = 0, height = 0, isLayoutValid?: boolean) {
	const handlers = new Map<string, Set<() => void>>()
	const srcWrites: any[] = []
	const view: any = {
		measured: { w: width, h: height },
		isLayoutValid,
		stretch: 'aspectFit',
		decodeWidth: undefined as any,
		decodeHeight: undefined as any,
		srcWrites,
		on: (event: string, callback: () => void) => {
			const set = handlers.get(event) ?? new Set()
			set.add(callback)
			handlers.set(event, set)
		},
		off: (event: string, callback: () => void) => handlers.get(event)?.delete(callback),
		getMeasuredWidth() {
			return view.measured.w
		},
		getMeasuredHeight() {
			return view.measured.h
		},
		emit(event: string) {
			for (const callback of handlers.get(event) ?? []) {
				callback()
			}
		},
		handlerCount(event: string) {
			return handlers.get(event)?.size ?? 0
		},
		layoutRequests: 0,
		requestLayout() {
			view.layoutRequests++
		},
	}

	let src: any
	Object.defineProperty(view, 'src', {
		get: () => src,
		set: (value) => {
			src = value
			srcWrites.push(value)
		},
		configurable: true,
	})

	return view
}

describe('sized image decode binding', () => {
	it('holds src until the first real layout, then issues decode dims in device px', () => {
		const view = mockView(0, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://feed/photo.jpg')
		expect(view.src).toBeUndefined()
		expect(view.decodeWidth).toBeUndefined()
		expect(view.handlerCount('layoutChanged')).toBe(1)

		view.measured = { w: 300, h: 200 }
		view.emit('layoutChanged')
		expect(view.src).toBe('res://feed/photo.jpg')
		expect(view.decodeWidth).toEqual({ value: 300, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 200, unit: 'px' })
		expect(view.srcWrites).toHaveLength(1)
	})

	it('issues with the one axis it knows — a 0 axis decodes at source', () => {
		const view = mockView(214, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://feed/photo.jpg')
		expect(view.src).toBe('res://feed/photo.jpg')
		expect(view.decodeWidth).toEqual({ value: 214, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 0, unit: 'px' })

		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(1)
	})

	it('issues at 0x0 after the first layout — both decode dims unknown', () => {
		const view = mockView(0, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://feed/photo.jpg')
		expect(view.src).toBeUndefined()

		view.emit('layoutChanged')
		expect(view.src).toBe('res://feed/photo.jpg')
		expect(view.decodeWidth).toEqual({ value: 0, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 0, unit: 'px' })
		expect(view.srcWrites).toHaveLength(1)
	})

	it('width-only flow: re-issues once the bitmap gives the view a height, never on a collapse to 0', () => {
		const view = mockView(214, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://feed/photo.jpg')
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(1)
		expect(view.decodeWidth).toEqual({ value: 214, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 0, unit: 'px' })

		// The loaded bitmap produced an intrinsic height — re-decode at the
		// real size (aspectFit is not in the fill/none exemption).
		view.measured = { w: 214, h: 160 }
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(2)
		expect(view.decodeWidth).toEqual({ value: 214, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 160, unit: 'px' })

		// A later measure back to 0 must not reload — reloading nulls
		// imageSource, which collapses the intrinsic height again (loop).
		view.measured = { w: 214, h: 0 }
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(2)
	})

	it('issues on update when the view already reports a valid layout', () => {
		const view = mockView(0, 0, true)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://feed/photo.jpg')
		expect(view.src).toBe('res://feed/photo.jpg')
		expect(view.srcWrites).toHaveLength(1)
	})

	it('reissueOnResize: false skips same-src reloads but still issues src changes', () => {
		const view = mockView(300, 200)
		const binding = createSizedImageBinding({ reissueOnResize: false })

		binding.update(view, 'res://a.jpg')
		expect(view.srcWrites).toHaveLength(1)

		view.measured = { w: 600, h: 400 }
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(1)

		binding.update(view, 'res://b.jpg')
		expect(view.srcWrites).toEqual(['res://a.jpg', 'res://b.jpg'])
	})

	it('issues immediately when the view is already measured, and repeats are no-ops', () => {
		const view = mockView(300, 200)
		const binding = createSizedImageBinding()

		binding.update(view, 'https://img.example/x.png')
		expect(view.src).toBe('https://img.example/x.png')
		expect(view.srcWrites).toHaveLength(1)

		binding.update(view, 'https://img.example/x.png')
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(1)
	})

	it('re-issues on a src change even when the size is unchanged', () => {
		const view = mockView(300, 200)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		binding.update(view, 'res://b.jpg')
		expect(view.src).toBe('res://b.jpg')
		expect(view.srcWrites).toEqual(['res://a.jpg', 'res://b.jpg'])
		expect(view.decodeWidth).toEqual({ value: 300, unit: 'px' })
	})

	it('re-issues at the new size on resize for aspect-fit stretches', () => {
		const view = mockView(300, 200)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		view.measured = { w: 600, h: 400 }
		view.emit('layoutChanged')
		expect(view.srcWrites).toHaveLength(2)
		expect(view.decodeWidth).toEqual({ value: 600, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 400, unit: 'px' })
	})

	it('does not reload on resize for fill or none — the expo-image gate', () => {
		for (const stretch of ['fill', 'none']) {
			const view = mockView(300, 200)
			view.stretch = stretch
			const binding = createSizedImageBinding()

			binding.update(view, 'res://a.jpg')
			view.measured = { w: 600, h: 400 }
			view.emit('layoutChanged')
			expect(view.srcWrites).toHaveLength(1)
			expect(view.decodeWidth).toEqual({
				value: stretch === 'fill' ? 300 : 0,
				unit: 'px',
			})
		}
	})

	it('never downsamples for stretch none — source pixels are the contract', () => {
		const view = mockView(300, 200)
		view.stretch = 'none'
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		expect(view.src).toBe('res://a.jpg')
		expect(view.decodeWidth).toEqual({ value: 0, unit: 'px' })
		expect(view.decodeHeight).toEqual({ value: 0, unit: 'px' })
	})

	it('requests a layout when the bitmap arrives — intrinsic axes re-measure', () => {
		const view = mockView(214, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		expect(view.layoutRequests).toBe(0)

		view.emit('imageSourceChange')
		expect(view.layoutRequests).toBe(1)
	})

	it('relayoutOnImageSource: false leaves the bitmap re-measure to the layout engine', () => {
		const view = mockView(214, 0)
		const binding = createSizedImageBinding({ relayoutOnImageSource: false })

		binding.update(view, 'res://a.jpg')
		view.emit('imageSourceChange')
		expect(view.layoutRequests).toBe(0)
	})

	it('defers one re-measure when a sync-decoded bitmap leaves an axis at 0', () => {
		vi.useFakeTimers()
		// Android: a `data:`/warm-cache decode lands inside the layout pass,
		// so no pending request exists for Mason's foreign-leaf re-measure.
		const view = mockView(214, 0)
		const binding = createSizedImageBinding({ relayoutOnImageSource: false })

		binding.update(view, 'res://a.jpg')
		view.imageSource = {}
		view.emit('imageSourceChange')
		expect(view.layoutRequests).toBe(0)

		vi.advanceTimersByTime(0)
		expect(view.layoutRequests).toBe(1)
	})

	it('skips the deferred request when the engine re-measured first', () => {
		vi.useFakeTimers()
		const view = mockView(214, 0)
		const binding = createSizedImageBinding({ relayoutOnImageSource: false })

		binding.update(view, 'res://a.jpg')
		view.imageSource = {}
		view.emit('imageSourceChange')

		view.measured = { w: 214, h: 160 }
		vi.advanceTimersByTime(0)
		expect(view.layoutRequests).toBe(0)
	})

	it('never requests for a stretched/flex-sized image — both axes are known', () => {
		vi.useFakeTimers()
		const view = mockView(107, 200)
		const binding = createSizedImageBinding({ relayoutOnImageSource: false })

		binding.update(view, 'res://a.jpg')
		view.imageSource = {}
		view.emit('imageSourceChange')
		vi.advanceTimersByTime(0)
		expect(view.layoutRequests).toBe(0)
	})

	it('does not request while imageSource is absent (src cleared)', () => {
		vi.useFakeTimers()
		const view = mockView(214, 0)
		const binding = createSizedImageBinding({ relayoutOnImageSource: false })

		binding.update(view, 'res://a.jpg')
		view.emit('imageSourceChange')
		vi.advanceTimersByTime(0)
		expect(view.layoutRequests).toBe(0)
	})

	it('moves the imageSource listener to a recreated view', () => {
		const first = mockView(214, 0)
		const second = mockView(214, 0)
		const binding = createSizedImageBinding()

		binding.update(first, 'res://a.jpg')
		binding.update(second, 'res://a.jpg')

		first.emit('imageSourceChange')
		expect(first.layoutRequests).toBe(0)
		expect(first.handlerCount('imageSourceChange')).toBe(0)

		second.emit('imageSourceChange')
		expect(second.layoutRequests).toBe(1)
	})

	it('re-checks a held issue on deferred ticks once the view is attached', () => {
		vi.useFakeTimers()
		// Android flips isLayoutValid without layoutChanged when bounds stay
		// 0x0 — the deferred retry is what observes it.
		const view = mockView(0, 0)
		view.isLoaded = true
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		expect(view.src).toBeUndefined()

		vi.advanceTimersByTime(0)
		vi.advanceTimersByTime(0)
		expect(view.src).toBeUndefined()

		view.isLayoutValid = true
		vi.runAllTimers()
		expect(view.src).toBe('res://a.jpg')
		expect(view.decodeWidth).toEqual({ value: 0, unit: 'px' })
	})

	it('stops requesting layout after dispose', () => {
		const view = mockView(214, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		binding.dispose()

		view.emit('imageSourceChange')
		expect(view.layoutRequests).toBe(0)
		expect(view.handlerCount('imageSourceChange')).toBe(0)
	})

	it('moves the listener to a recreated view and re-issues at its size', () => {
		const first = mockView(300, 200)
		const second = mockView(0, 0)
		const binding = createSizedImageBinding()

		binding.update(first, 'res://a.jpg')
		expect(first.src).toBe('res://a.jpg')

		binding.update(second, 'res://a.jpg')
		expect(first.handlerCount('layoutChanged')).toBe(0)
		expect(second.handlerCount('layoutChanged')).toBe(1)
		expect(second.src).toBeUndefined()

		second.measured = { w: 100, h: 50 }
		second.emit('layoutChanged')
		expect(second.src).toBe('res://a.jpg')
		expect(second.decodeWidth).toEqual({ value: 100, unit: 'px' })
	})

	it('keeps a held src pending until layout even across re-renders', () => {
		const view = mockView(0, 0)
		const binding = createSizedImageBinding()

		binding.update(view, 'res://a.jpg')
		binding.update(view, 'res://b.jpg')
		expect(view.src).toBeUndefined()

		view.measured = { w: 50, h: 50 }
		view.emit('layoutChanged')
		expect(view.src).toBe('res://b.jpg')
		expect(view.srcWrites).toEqual(['res://b.jpg'])
	})
})
