import { describe, expect, it } from 'vitest'
import { createAppKitMediaQuerySource } from './media-query-source.macos'

describe('AppKit media query source', () => {
	it('uses host dimensions on each notification and releases the subscription', () => {
		let width = 900
		const listeners = new Set<() => void>()
		const source = createAppKitMediaQuerySource('(min-width: 800px)', {
			get windowSize() { return { width, height: 600 } },
			onWindowResize(notify) { listeners.add(notify); return () => { listeners.delete(notify) } },
		})
		const observed: boolean[] = []
		const off = source.subscribe(() => observed.push(source.getSnapshot()))
		expect(source.getSnapshot()).toBe(true)
		expect(source.getSnapshot()).toBe(true) // Fresh host objects never escape.
		width = 700
		for (const notify of listeners) {notify()}
		expect(observed).toEqual([false])
		off()
		expect(listeners.size).toBe(0)
	})

	it('reports desktop traits independently of window orientation', () => {
		const host = { windowSize: { width: 400, height: 800 } }
		expect(createAppKitMediaQuerySource('(pointer: fine) and (hover: hover)', host).getSnapshot()).toBe(true)
		expect(createAppKitMediaQuerySource('(orientation: portrait)', host).getSnapshot()).toBe(true)
		expect(createAppKitMediaQuerySource('(pointer: coarse)', host).getSnapshot()).toBe(false)
	})

	it('returns false and a harmless unsubscribe when the host is absent', () => {
		const source = createAppKitMediaQuerySource('(max-width: 800px)')
		expect(source.getSnapshot()).toBe(false)
		expect(() => source.subscribe(() => {})()).not.toThrow()
	})
})
