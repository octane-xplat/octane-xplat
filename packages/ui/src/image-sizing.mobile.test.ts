import { describe, expect, it, vi } from 'vitest'
import { createSizedImageBinding } from './image-sizing'

function mockView(width = 0, height = 0) {
	const handlers = new Map<string, Set<() => void>>()
	const srcWrites: any[] = []
	const view: any = {
		measured: { w: width, h: height },
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
			for (const callback of handlers.get(event) ?? []) {callback()}
		},
		handlerCount(event: string) {
			return handlers.get(event)?.size ?? 0
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
