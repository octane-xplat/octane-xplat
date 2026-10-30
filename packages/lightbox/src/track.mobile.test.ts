import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { MotionValue } from '../../motion/src/value'
import { Track } from './track.mobile.tsrx'

vi.mock('@octane-xplat/ui', () => import('../test/content-ui.mobile.tsrx'))

// Pure math and object-driver regressions complement the native iOS probe.
describe('native track math', () => {
	it('progress = -x / stride', async () => {
		const { clamp } = await import('./math')
		const stride = 402
		const progress = (x: number) => -x / stride
		expect(progress(-402)).toBe(1)
		expect(progress(-200)).toBeCloseTo(0.5)
		expect(clamp(Math.round(200 / stride), 0, 2)).toBe(0)
	})
	it('snap projection: x + 0.2*vx decides the landing slide', async () => {
		const { clamp } = await import('./math')
		const stride = 402
		const snap = (x: number, vx: number) => clamp(Math.round(-(x + 0.2 * vx) / stride), 0, 2)
		expect(snap(-200, -900)).toBe(1)
		expect(snap(-60, 0)).toBe(0)
		expect(snap(-700, 0)).toBe(2)
	})
})

describe('createInputDispatch', () => {
	const pt = { x: 0, y: 0 }
	it('routes a pan sequence to the slide latched at panStart, even if index changes', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		let index = 1
		const d = createInputDispatch(() => index)
		const seen: number[] = []
		d.inputs.set(0, () => seen.push(0))
		d.inputs.set(1, () => seen.push(1))
		d({ kind: 'panStart', at: pt, pointer: 'touch' })
		index = 2
		d({ kind: 'panMove', at: pt })
		d({ kind: 'panEnd', at: pt, velocity: { x: 0, y: 0 }, cancelled: false })
		expect(seen).toEqual([1, 1, 1])
	})
	it('taps and double taps route to the current slide', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		const d = createInputDispatch(() => 2)
		const seen: string[] = []
		d.inputs.set(2, (i: any) => seen.push(i.kind))
		d({ kind: 'tap', at: pt, pointer: 'touch' })
		d({ kind: 'doubleTap', at: pt })
		expect(seen).toEqual(['tap', 'doubleTap'])
	})
	it('unregistered slides stop receiving intents', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		const d = createInputDispatch(() => 0)
		const seen: string[] = []
		const send = (i: any) => seen.push(i.kind)
		d.inputs.set(0, send)
		d.inputs.delete(0)
		d({ kind: 'tap', at: pt, pointer: 'touch' })
		expect(seen).toEqual([])
	})
})
it('restores the current slide and completes or cancels snaps without progress feedback', async () => {
	vi.useFakeTimers()
	const progress = new MotionValue(1, {
		now: () => Date.now(),
		request: (callback) => setTimeout(callback, 16) as any,
		cancel: (id) => clearTimeout(id),
	})
	const container = createObjectContainer('nativescript')
	const object = createObjectDriver('nativescript')
	const parent = { getActualSize: () => ({ width: 400, height: 800 }) }
	const root = createUniversalRoot(container, {
		...object,
		getPublicInstance(container, id) {
			const view = object.getPublicInstance(container, id)
			if (view) {Object.assign(view, { parent, getActualSize: parent.getActualSize })}
			return view
		},
	})
	const controllerRef: any = { current: null }
	const onScrollIndex = vi.fn()
	const props = {
		items: [{ src: '', alt: 'One' }, { src: '', alt: 'Two' }],
		currentIndex: 1, controllerRef, onScrollIndex, progress, zoomed: false,
	}
	try {
		root.render(Track, props)
		flushUniversalSync(() => {})
		expect(progress.get()).toBe(1)
		controllerRef.current.goTo(0, 'smooth')
		await vi.advanceTimersByTimeAsync(32)
		const mid = progress.get()
		expect(mid).toBeGreaterThan(0)
		expect(mid).toBeLessThan(1)
		flushUniversalSync(() => root.render(Track, { ...props, zoomed: true }))
		expect(progress.get()).toBe(mid)
		await vi.advanceTimersByTimeAsync(2000)
		expect(progress.get()).toBe(0)
		expect(onScrollIndex).toHaveBeenCalledExactlyOnceWith(0)
		controllerRef.current.goTo(1, 'smooth')
		await vi.advanceTimersByTimeAsync(32)
		controllerRef.current.freeze(1)
		await vi.advanceTimersByTimeAsync(2000)
		expect(progress.get()).toBe(1)
		expect(onScrollIndex).toHaveBeenCalledTimes(1)
	} finally {
		root.unmount()
		progress.destroy()
		vi.clearAllTimers()
		vi.useRealTimers()
	}
})

it('dissolves distant slides, interpolates progress, and restores temporary styles on cancellation', async () => {
	vi.useFakeTimers()
	const progress = new MotionValue(0, {
		now: () => Date.now(), request: cb => setTimeout(cb, 16) as any, cancel: id => clearTimeout(id),
	})
	const slides = Array.from({ length: 6 }, () => ({ opacity: 0.8, translateX: 3, zIndex: 2 }))
	const object = createObjectDriver('nativescript')
	const parent = { getActualSize: () => ({ width: 400, height: 800 }) }
	const root = createUniversalRoot(createObjectContainer('nativescript'), {
		...object,
		getPublicInstance(container, id) {
			const view = object.getPublicInstance(container, id)
			if (view) {Object.assign(view, { parent, getActualSize: parent.getActualSize, getChildAt: (i: number) => slides[i] })}
			return view
		},
	})
	const controllerRef: any = { current: null }
	try {
		flushUniversalSync(() => root.render(Track, { items: slides.map(() => ({ src: '', alt: '' })), currentIndex: 0, controllerRef, onScrollIndex() {}, progress, zoomed: false }))
		const done = controllerRef.current.fade(0, 5)
		expect(slides[0].translateX).toBe(2003)
		expect(slides[5].opacity).toBe(0)
		await vi.advanceTimersByTimeAsync(100)
		expect(slides[0].opacity).toBeGreaterThan(0)
		expect(slides[0].opacity).toBeLessThan(0.8)
		expect(slides[5].opacity).toBeGreaterThan(0)
		expect(progress.get()).toBeGreaterThan(0)
		expect(progress.get()).toBeLessThan(5)
		await vi.advanceTimersByTimeAsync(300)
		await done
		expect(progress.get()).toBe(5)
		expect(slides.every(s => s.opacity === 0.8 && s.translateX === 3 && s.zIndex === 2)).toBe(true)
		const interrupted = controllerRef.current.fade(5, 0)
		await vi.advanceTimersByTimeAsync(32)
		controllerRef.current.freeze(2)
		await interrupted
		expect(progress.get()).toBe(2)
		expect(slides.every(s => s.opacity === 0.8 && s.translateX === 3 && s.zIndex === 2)).toBe(true)
		const unmounted = controllerRef.current.fade(2, 5)
		root.unmount()
		await unmounted
		expect(slides.every(s => s.opacity === 0.8 && s.translateX === 3 && s.zIndex === 2)).toBe(true)
	} finally { root.unmount(); progress.destroy(); vi.clearAllTimers(); vi.useRealTimers() }
})
