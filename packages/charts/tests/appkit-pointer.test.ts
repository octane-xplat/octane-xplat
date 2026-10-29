import { describe, expect, test } from 'vitest'
import { createAppKitChartPointer } from '../src/appkit-pointer.macos'
import type { ScrubPhase } from '../src/core/hit'

function fixture() {
	const f: any = { calls: [], located: { x: 3, y: 4 }, handlers: null, releases: 0 }
	const bridge = {
		locatePointer: () => f.located,
		observePointerMotion: (_view: unknown, handlers: any) => {
			f.handlers = handlers
			return () => { f.releases++ }
		},
	}
	const pointer = createAppKitChartPointer(
		(phase: ScrubPhase, x: number, y: number) => f.calls.push([phase, x, y]),
		() => ({ width: 200, height: 100 }),
		() => bridge,
	)
	const pan = (state: number, x = 20, y = 30, deltaX = 5, deltaY = 10) =>
		pointer.pan({ state, x, y, deltaX, deltaY })
	f.pointer = pointer
	f.pan = pan
	return f
}

describe('appkit chart pointer', () => {
	test('pan began/changed/ended produces down+start move, move, up', () => {
		const f = fixture()
		f.pan(1)
		f.pan(2, 22, 32)
		f.pan(3, 22, 32)
		expect(f.calls).toEqual([
			['down', 15, 20],
			['move', 20, 30],
			['move', 22, 32],
			['up', 22, 32],
		])
	})

	test('a non-finite changed event is ignored and a non-finite end cancels', () => {
		const f = fixture()
		f.pan(1)
		f.pan(2, NaN, NaN)
		f.pan(3, NaN, NaN)
		expect(f.calls).toEqual([['down', 15, 20], ['move', 20, 30], ['cancel', 0, 0]])
		f.pan(2, 40, 50)
		expect(f.calls).toHaveLength(3)
	})

	test('cancel only applies while panning', () => {
		const f = fixture()
		f.pan(0)
		expect(f.calls).toEqual([])
		f.pan(1)
		f.pan(0)
		expect(f.calls).toEqual([['down', 15, 20], ['move', 20, 30], ['cancel', 0, 0]])
	})

	test('tap uses the located mouse point or falls back to the scene center', () => {
		const f = fixture()
		f.pointer.tap({})
		f.located = null
		f.pointer.tap({})
		expect(f.calls).toEqual([['tap', 3, 4], ['tap', 100, 50]])
	})

	test('observe reports hover/leave and suppresses them while panning', () => {
		const f = fixture()
		f.pointer.observe({})
		f.handlers.move(8, 9)
		f.handlers.exit()
		f.pan(1)
		f.handlers.move(8, 9)
		f.handlers.exit()
		expect(f.calls).toEqual([
			['hover', 8, 9],
			['leave', 0, 0],
			['down', 15, 20],
			['move', 20, 30],
		])
	})

	test('observe is a no-op without a view or a bridge', () => {
		const f = fixture()
		expect(f.pointer.observe(null)).toBeTypeOf('function')
		const unbridged = createAppKitChartPointer(
			() => {},
			() => ({ width: 0, height: 0 }),
			() => undefined,
		)
		expect(unbridged.observe({})).toBeTypeOf('function')
		const partial = createAppKitChartPointer(
			() => {},
			() => ({ width: 0, height: 0 }),
			() => ({ locatePointer: () => null }),
		)
		partial.observe({})()
	})

	test('observe forwards the bridge release', () => {
		const f = fixture()
		const off = f.pointer.observe({})
		off()
		expect(f.releases).toBe(1)
	})
})
