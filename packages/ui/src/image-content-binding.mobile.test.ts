import { describe, expect, it } from 'vitest'
import { createImageContentBinding } from './image-content-binding'

/** The real `issue` is the sized-decode binding — this mock lands src
 *  directly and records the decode-gate override per write. */
const env = {
	isAndroid: false,
	screenScale: () => 3,
	issue: (view: any, src: any, gate?: string) => {
		view.src = src

		;(view.issueGates ??= []).push(gate)
	},
}

const create = () => createImageContentBinding(env)

function mockView(width = 0, height = 0) {
	const handlers = new Map<string, Set<() => void>>()
	const view: any = {
		measured: { w: width, h: height },
		imageSource: undefined as any,
		srcWrites: [] as any[],
		on: (event: string, callback: () => void) => {
			const set = handlers.get(event) ?? new Set()
			set.add(callback)
			handlers.set(event, set)
		},
		off: (event: string, callback: () => void) => handlers.get(event)?.delete(callback),
		getActualSize() {
			return { width: view.measured.w, height: view.measured.h }
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
			view.srcWrites.push(value)
		},
		configurable: true,
	})

	return view
}

const noSources = { source: 'img.png', sources: null, fit: 'cover' as const, position: {}, computed: false }

describe('image content binding — source handoff', () => {
	it('forwards a single source to the issue seam with no decode override', () => {
		const view = mockView(100, 100)
		const binding = create()
		binding.update(view, view, noSources)
		expect(view.src).toBe('img.png')
		expect(view.issueGates).toEqual([undefined])
		expect(view.handlerCount('layoutChanged')).toBe(0)
	})
})

describe('image content binding — source selection (L8)', () => {
	const sources = [
		{ uri: 'https://img.example/photo-200.jpg', width: 200, height: 200 },
		{ uri: 'https://img.example/photo-800.jpg', width: 800, height: 800 },
	]

	const arrayUpdate = { ...noSources, source: null, sources }

	it('holds src until a real layout, then picks the closest pixel count', () => {
		const view = mockView(0, 0)
		const binding = create()
		binding.update(view, view, arrayUpdate)

		expect(view.src).toBeUndefined()
		expect(view.handlerCount('layoutChanged')).toBe(1)

		// 100x100 dips at scale 3 → 300x300 px → closest to 200²
		view.measured = { w: 100, h: 100 }
		view.emit('layoutChanged')
		expect(view.src).toBe('https://img.example/photo-200.jpg')

		// 200 dips → 600px → closest to 800²
		view.measured = { w: 200, h: 200 }
		view.emit('layoutChanged')
		expect(view.src).toBe('https://img.example/photo-800.jpg')
	})

	it('re-issues the same pick on repeat evaluates — dedup lives in the sized binding', () => {
		const view = mockView(100, 100)
		const binding = create()
		binding.update(view, view, arrayUpdate)

		view.emit('layoutChanged')
		binding.update(view, view, arrayUpdate)
		expect(view.srcWrites.every((w) => w === 'https://img.example/photo-200.jpg')).toBe(true)
	})
})

describe('image content binding — computed content rect (L7)', () => {
	const update = (fit: any, position: any) => ({
		...noSources,
		fit,
		position,
		computed: true,
	})

	it('sizes the inner to the host box until imageSource arrives, then to the rect', () => {
		const host = mockView(400, 300)
		const image = mockView(0, 0)
		const binding = create()
		binding.update(host, image, update('cover', {}))

		// Host-box placeholder — a real measure is what unblocks the
		// sized-decode gate; the src goes through the issue seam.
		expect(image.width).toBe(400)
		expect(image.height).toBe(300)
		expect(image.src).toBe('img.png')
		expect(image.issueGates).toContain('aspectFit')

		image.imageSource = { width: 200, height: 100 }
		image.emit('imageSourceChange')
		// cover 200x100 in 400x300 → 600x300, centered x=-100
		expect(image.width).toBe(600)
		expect(image.height).toBe(300)
		expect(image.left).toBe(-100)
		expect(image.top).toBe(0)
	})

	it('centers none at intrinsic size (the iOS TopLeft divergence) and asks for full-res decode', () => {
		const host = mockView(400, 300)
		const image = mockView(0, 0)
		image.imageSource = { width: 200, height: 100 }
		const binding = create()
		binding.update(host, image, update('none', {}))

		expect(image.width).toBe(200)
		expect(image.height).toBe(100)
		expect(image.left).toBe(100)
		expect(image.top).toBe(100)
		expect(image.issueGates).toContain('none')
	})

	it('applies edge positions and re-evaluates on resize', () => {
		const host = mockView(400, 300)
		const image = mockView(0, 0)
		image.imageSource = { width: 200, height: 100 }
		const binding = create()
		binding.update(host, image, update('none', { bottom: 0, right: 0 }))

		expect(image.left).toBe(200)
		expect(image.top).toBe(200)

		host.measured = { w: 300, h: 200 }
		host.emit('layoutChanged')
		expect(image.left).toBe(100)
		expect(image.top).toBe(100)
	})

	it('does not resubscribe layoutChanged on repeated updates', () => {
		const host = mockView(400, 300)
		const image = mockView(0, 0)
		const binding = create()
		binding.update(host, image, update('cover', {}))
		binding.update(host, image, update('cover', {}))
		expect(host.handlerCount('layoutChanged')).toBe(1)
		expect(image.handlerCount('imageSourceChange')).toBe(1)
	})
})
