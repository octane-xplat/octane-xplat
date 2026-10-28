import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { TestView, TestScrollView } = vi.hoisted(() => {
	class TestView {
		isLoaded = true
		parent: TestView | null = null
		x = 0
		y = 0
		width = 20
		height = 20
		private listeners = new Map<string, Set<() => void>>()
		on(event: string, listener: () => void) {
			let listeners = this.listeners.get(event)
			if (!listeners) {
				this.listeners.set(event, (listeners = new Set()))
			}
			listeners.add(listener)
		}
		off(event: string, listener: () => void) {
			this.listeners.get(event)?.delete(listener)
		}
		listenerCount(event: string) {
			return this.listeners.get(event)?.size ?? 0
		}
		emit(event: string) {
			for (const listener of this.listeners.get(event) ?? []) {
				listener()
			}
		}
		getLocationOnScreen() {
			return { x: this.x, y: this.y }
		}
		getActualSize() {
			return { width: this.width, height: this.height }
		}
	}
	return { TestView, TestScrollView: class extends TestView {} }
})

vi.mock('@nativescript/core', () => ({
	View: TestView,
	ScrollView: TestScrollView,
	ListView: class extends TestView {},
	Screen: { mainScreen: { widthDIPs: 100, heightDIPs: 100 } },
}))

import { IntersectionObserver } from '../../intersection-observer/src/observer'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

// Event-emitter/geometry seam only: these checks do not qualify native layout
// timing or OS scrolling. The observer implementation is not mocked.
it('reports an exit after its scroll ancestor moves a target outside the viewport', async () => {
	const target = new TestView()
	const scroller = new TestScrollView()
	scroller.width = scroller.height = 100
	target.parent = scroller
	const callback = vi.fn()
	const observer = new IntersectionObserver(callback)
	try {
		observer.observe(target)
		await vi.runAllTimersAsync()
		expect(callback.mock.calls[0][0][0].isIntersecting).toBe(true)
		target.x = 200
		scroller.emit('scroll')
		await vi.runAllTimersAsync()
		expect(callback).toHaveBeenCalledTimes(2)
		expect(callback.mock.calls[1][0][0].isIntersecting).toBe(false)
	} finally {
		observer.disconnect()
	}
})

it('reports an exit when a target layout change moves it outside the viewport', async () => {
	const target = new TestView()
	const callback = vi.fn()
	const observer = new IntersectionObserver(callback)
	try {
		observer.observe(target)
		await vi.runAllTimersAsync()
		expect(callback.mock.calls[0][0][0].isIntersecting).toBe(true)
		target.x = 200
		target.emit('layoutChanged')
		await vi.runAllTimersAsync()
		expect(callback).toHaveBeenCalledTimes(2)
		expect(callback.mock.calls[1][0][0].isIntersecting).toBe(false)
	} finally {
		observer.disconnect()
	}
})

it('reports an exit when a visible target unloads', async () => {
	const target = new TestView()
	const callback = vi.fn()
	const observer = new IntersectionObserver(callback)
	try {
		observer.observe(target)
		await vi.runAllTimersAsync()
		expect(callback.mock.calls[0][0][0].isIntersecting).toBe(true)
		target.isLoaded = false
		target.emit('unloaded')
		await vi.runAllTimersAsync()
		expect(callback).toHaveBeenCalledTimes(2)
		expect(callback.mock.calls[1][0][0].isIntersecting).toBe(false)
	} finally {
		observer.disconnect()
	}
})

for (const cleanup of ['unobserve', 'disconnect'] as const) {
	it(`deduplicates each view/event pair and cleans up with ${cleanup}`, async () => {
		const target = new TestView()
		const root = new TestScrollView()
		root.width = root.height = 100
		target.parent = root
		const callback = vi.fn()
		const observer = new IntersectionObserver(callback, { root })
		observer.observe(target)
		observer.observe(target)
		for (const event of ['loaded', 'layoutChanged', 'unloaded']) {
			expect(target.listenerCount(event)).toBe(1)
		}
		for (const event of ['scroll', 'layoutChanged']) {
			expect(root.listenerCount(event)).toBe(1)
		}
		await vi.runAllTimersAsync()
		target.x = 200
		root.emit('layoutChanged')
		root.emit('scroll')
		await vi.runAllTimersAsync()
		expect(callback).toHaveBeenCalledTimes(2)
		if (cleanup === 'unobserve') {
			observer.unobserve(target)
		} else {
			observer.disconnect()
		}
		for (const event of ['loaded', 'layoutChanged', 'unloaded']) {
			expect(target.listenerCount(event)).toBe(0)
		}
		for (const event of ['scroll', 'layoutChanged']) {
			expect(root.listenerCount(event)).toBe(0)
		}
		target.x = 0
		target.emit('layoutChanged')
		root.emit('scroll')
		await vi.runAllTimersAsync()
		expect(callback).toHaveBeenCalledTimes(2)
		observer.disconnect()
	})
}
