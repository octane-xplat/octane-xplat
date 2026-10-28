import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Application } from '@nativescript/core'

const observed: { observer: any } = { observer: null }
vi.mock('octane/universal/native', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	observeBatches: (o: any) => {
		observed.observer = o
		return () => {
			observed.observer = null
		}
	},
}))

import { barrier as iosBarrier, layoutSupported as iosSupported } from './barrier.ios'
import { barrier as androidBarrier, layoutSupported as androidSupported } from './barrier.android'
import { measureNativeBox as measureIos } from './measure.ios'
import { measureNativeBox as measureAndroid } from './measure.android'
import { attachHost } from '../host'

const microtasks = async () => {
	await Promise.resolve()
	await Promise.resolve()
}

const fakeRoot = (invalidations: string[]) => ({
	invalidate: (k: string) => invalidations.push(k),
	isMotionHost: () => false,
})

function fakeVto() {
	const listeners: Record<string, any[]> = { global: [], pre: [] }
	return {
		listeners,
		isAlive: () => true,
		addOnGlobalLayoutListener(l: any) {
			listeners.global.push(l)
		},
		removeOnGlobalLayoutListener(l: any) {
			listeners.global.splice(listeners.global.indexOf(l), 1)
		},
		addOnPreDrawListener(l: any) {
			listeners.pre.push(l)
		},
		removeOnPreDrawListener(l: any) {
			listeners.pre.splice(listeners.pre.indexOf(l), 1)
		},
	}
}

function fakeView(vto: any) {
	return {
		getViewTreeObserver: () => vto,
		postInvalidateOnAnimation: vi.fn(),
		postInvalidate: vi.fn(),
	}
}

function installAndroid(decorView?: any) {
	;(globalThis as any).android = {
		view: {
			ViewTreeObserver: {
				OnGlobalLayoutListener: class {
					constructor(public impl: any) {}
				},
				OnPreDrawListener: class {
					constructor(public impl: any) {}
				},
			},
		},
	}
	;(Application as any).android = {
		foregroundActivity: decorView ? { getWindow: () => ({ getDecorView: () => decorView }) } : null,
	}
}

function androidView(vto: any) {
	const nv = { getRootView: () => ({ getViewTreeObserver: () => vto }) }
	return { host: { nativeView: nv } }
}

beforeEach(() => {
	vi.useFakeTimers()
	;(globalThis as any).UIApplication = undefined
	;(globalThis as any).android = undefined
})

afterEach(() => {
	vi.useRealTimers()
	observed.observer = null
	delete (Application as any).android
})

describe('ios barrier', () => {
	it('reports supported and maps didApply to mutation invalidation', () => {
		expect(iosSupported).toBe(true)
		const invalidations: string[] = []
		const stop = iosBarrier.observe(fakeRoot(invalidations) as any)
		observed.observer.didApply({ host: {} })
		expect(invalidations).toEqual(['mutation'])
		stop()
		expect(observed.observer).toBeNull()
	})

	it('lays out every window then runs the pass inside one microtask', async () => {
		const calls: string[] = []
		const win = (name: string) => ({ name, layoutIfNeeded: () => calls.push(`layout:${name}`) })
		;(globalThis as any).UIApplication = {
			sharedApplication: {
				connectedScenes: {
					allObjects: [
						{ windows: { count: 2, objectAtIndex: (i: number) => [win('a'), win('b')][i] } },
					],
				},
				windows: { count: 0, objectAtIndex: () => null },
			},
		}
		iosBarrier.schedule(() => calls.push('pass'))
		expect(calls).toEqual([])
		await microtasks()
		expect(calls).toEqual(['layout:a', 'layout:b', 'pass'])
	})
})

describe('android barrier', () => {
	it('registers both listeners per VTO and posts an invalidate on the decor', () => {
		expect(androidSupported).toBe(true)
		const v1 = fakeVto()
		const decorVto = fakeVto()
		const decor = fakeView(decorVto)
		installAndroid(decor)
		const invalidations: string[] = []
		const stop = androidBarrier.observe(fakeRoot(invalidations) as any)
		// Two containers on the same root view → one listener pair.
		observed.observer.didApply(androidView(v1))
		observed.observer.didApply(androidView(v1))

		androidBarrier.schedule(() => {})
		expect(v1.listeners.global.length).toBe(1)
		expect(v1.listeners.pre.length).toBe(1)
		expect(decorVto.listeners.global.length).toBe(1)
		expect(decorVto.listeners.pre.length).toBe(1)
		expect(decor.postInvalidateOnAnimation).toHaveBeenCalledTimes(1)
		stop()
	})

	it('first event runs the pass once and removes listeners on every VTO', () => {
		const v1 = fakeVto()
		const decorVto = fakeVto()
		installAndroid(fakeView(decorVto))
		const invalidations: string[] = []
		const stop = androidBarrier.observe(fakeRoot(invalidations) as any)
		observed.observer.didApply(androidView(v1))

		const runs: number[] = []
		androidBarrier.schedule(() => runs.push(1))

		expect(v1.listeners.pre[0].impl.onPreDraw()).toBe(true)
		expect(runs.length).toBe(1)
		expect(v1.listeners.global.length).toBe(0)
		expect(v1.listeners.pre.length).toBe(0)
		expect(decorVto.listeners.global.length).toBe(0)
		expect(decorVto.listeners.pre.length).toBe(0)

		// A later event on another VTO must not re-run the pass.
		decorVto.listeners.global[0]?.impl?.onGlobalLayout?.()
		expect(runs.length).toBe(1)
		stop()
	})

	it('runs the pass in a microtask when there are no views', async () => {
		installAndroid() // no decor
		const invalidations: string[] = []
		const stop = androidBarrier.observe(fakeRoot(invalidations) as any)
		// No containers observed → no views to traverse.
		const runs: number[] = []
		androidBarrier.schedule(() => runs.push(1))
		expect(runs.length).toBe(0)
		await Promise.resolve().then(() => Promise.resolve())
		expect(runs.length).toBe(1)
		stop()
	})
})

describe('measure', () => {
	it('ios: sums center-minus-half-bounds up the chain, ignoring scroll offsets', () => {
		const ui = (x: number, y: number, w: number, h: number, parent: any = null) => ({
			center: { x: x + w / 2, y: y + h / 2 },
			bounds: { size: { width: w, height: h } },
			superview: parent,
		})
		const win = ui(0, 0, 390, 800)
		// Scroll lives in the scroll view's bounds.origin, never in a center,
		// so a 120-DIP scroll leaves the content view's center unchanged.
		const scrollView = ui(0, 200, 390, 400, win)
		const scrollContent = ui(0, 0, 390, 800, scrollView)
		const child = ui(40, 160, 50, 50, scrollContent)
		expect(measureIos({ nativeViewProtected: child })).toEqual({
			x: { min: 40, max: 90 },
			y: { min: 360, max: 410 },
		})
	})

	it('android: sums left/top divided by density, ignoring translation', () => {
		const metrics = { getDisplayMetrics: () => ({ density: 2 }) }
		const av = (left: number, top: number, w: number, h: number, parent: any = null) => ({
			getLeft: () => left,
			getTop: () => top,
			getWidth: () => w,
			getHeight: () => h,
			getResources: () => metrics,
			getParent: () => parent,
		})
		const decor = av(0, 0, 800, 1600)
		const inner = av(10, 30, 200, 100, decor)
		const child = av(80, 60, 100, 100, inner)
		expect(measureAndroid({ nativeView: child })).toEqual({
			x: { min: 45, max: 95 },
			y: { min: 45, max: 95 },
		})
	})

	it('android: stops the chain at a non-View parent (ViewRootImpl)', () => {
		const metrics = { getDisplayMetrics: () => ({ density: 2 }) }
		const viewRootImpl = { getParent: () => null } // no getLeft — would throw if walked
		const child = {
			getLeft: () => 80,
			getTop: () => 60,
			getWidth: () => 100,
			getHeight: () => 100,
			getResources: () => metrics,
			getParent: () => viewRootImpl,
		}
		expect(measureAndroid({ nativeView: child })).toEqual({
			x: { min: 40, max: 90 },
			y: { min: 30, max: 80 },
		})
	})
})

describe('native host projection ops', () => {
	const fakeNode = () =>
		({ opacity: 1, translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0 }) as any

	const projection = {
		delta: {
			x: { translate: -50, scale: 0.5, origin: 0.5, originPoint: 0 },
			y: { translate: 0, scale: 1, origin: 0.5, originPoint: 0 },
		},
		treeScale: { x: 1, y: 1 },
		latest: { rotate: 0 },
	}

	it('merges channel writes so an opacity-only write keeps transforms', () => {
		const node = fakeNode()
		const host = attachHost(node)
		host.write({ x: 10 })
		host.write({ opacity: 0.5 })
		expect(node.translateX).toBe(10)
		expect(node.opacity).toBe(0.5)
	})

	it('project maps the projection write and project(null) restores channels', () => {
		const node = fakeNode()
		const host = attachHost(node)
		host.write({ x: 10 })
		host.project!(projection as any)
		expect(node.translateX).toBe(-50)
		expect(node.scaleX).toBe(0.5)
		expect(node.rotate).toBe(0)

		host.project!(null)
		expect(node.translateX).toBe(10)
		expect(node.scaleX).toBe(1)
	})

	it('project(null) restores channel values written to the node while projecting', () => {
		const node = fakeNode()
		const host = attachHost(node)
		host.write({ x: 10 })
		host.project!({ ...projection, latest: { x: 30, rotate: 0 } } as any)
		host.project!(null)
		expect(node.translateX).toBe(30)
	})

	it('resetProjection is a no-op (native measurement ignores transforms)', () => {
		const node = fakeNode()
		const host = attachHost(node)
		host.project!(projection as any)
		host.resetProjection?.()
		expect(node.translateX).toBe(-50)
		expect(node.scaleX).toBe(0.5)
	})
})
