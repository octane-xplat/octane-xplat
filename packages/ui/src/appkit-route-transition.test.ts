import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
	createAppKitRouteTransitions,
	defineAppKitTransition,
} from './appkit-route-transition.macos'

import type { RouteTransitionContext } from './props'

const context: RouteTransitionContext = {
	action: 'push',
	direction: 'forward',
	from: null,
	to: null,
}

let reduced = false
beforeEach(() => {
	vi.useFakeTimers()
	vi.stubGlobal('NSWorkspace', {
		sharedWorkspace: {
			get accessibilityDisplayShouldReduceMotion() {
				return reduced
			},
		},
	})
	vi.stubGlobal('CATransaction', { begin() {}, commit() {}, setDisableActions() {} })
	reduced = false
})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

function view() {
	const transforms: Record<string, number> = {}
	return {
		alphaValue: 1,
		wantsLayer: false,
		layer: {
			setValueForKeyPath(value: number, path: string) {
				transforms[path] = value
			},
		},
		transforms,
	}
}

it('samples the existing controller, restores its wrapper and completes independently', async () => {
	const pane = view()
	const effect = createAppKitRouteTransitions()
	const definition = defineAppKitTransition({
		from: { opacity: 0.2, translateY: 20, rotate: 90, scaleX: 0.8 },
		duration: 160,
	})
	const finished = effect.run(context, 'detail', definition, pane)
	expect(pane.alphaValue).toBe(0.2)
	expect(pane.transforms['transform.translation.y']).toBe(-20)
	expect(pane.transforms['transform.rotation.z']).toBeCloseTo(Math.PI / 2)
	await vi.advanceTimersByTimeAsync(80)
	expect(pane.alphaValue).toBeGreaterThan(0.2)
	expect(pane.alphaValue).toBeLessThan(1)
	await vi.advanceTimersByTimeAsync(80)
	expect(await finished).toEqual({ status: 'completed' })
	expect(pane.alphaValue).toBe(1)
	expect(pane.transforms).toEqual({
		'transform.translation.y': -0,
		'transform.rotation.z': 0,
		'transform.scale.x': 1,
	})
	expect(vi.getTimerCount()).toBe(0)
})

it('interrupts replaced effects and prevents late writes to retained views', async () => {
	const first = view(),
		second = view()
	const effect = createAppKitRouteTransitions()
	const definition = defineAppKitTransition({ from: { opacity: 0 }, duration: 160 })
	const old = effect.run(context, 'detail', definition, first)
	await vi.advanceTimersByTimeAsync(32)
	const next = effect.run(context, 'detail', definition, second)
	expect(await old).toEqual({ status: 'skipped', reason: 'interrupted' })
	expect(first.alphaValue).toBe(1)
	effect.interrupt()
	expect(await next).toEqual({ status: 'skipped', reason: 'interrupted' })
	await vi.advanceTimersByTimeAsync(1000)
	expect(first.alphaValue).toBe(1)
	expect(second.alphaValue).toBe(1)
	expect(vi.getTimerCount()).toBe(0)
})

it('keeps independent pane effects isolated', async () => {
	const first = createAppKitRouteTransitions(),
		second = createAppKitRouteTransitions()
	const definition = defineAppKitTransition({ from: { opacity: 0 }, duration: 32 })
	const a = first.run(context, 'detail', definition, view())
	const b = second.run(context, 'detail', definition, view())
	first.interrupt()
	await vi.advanceTimersByTimeAsync(32)
	expect(await a).toEqual({ status: 'skipped', reason: 'interrupted' })
	expect(await b).toEqual({ status: 'completed' })
})

it('provides Back context and captures static definitions immutably', async () => {
	const from = { opacity: 0.2 }
	const definition = defineAppKitTransition({ from, duration: 0 })
	from.opacity = 0.8
	const pane = view()
	expect(await createAppKitRouteTransitions().run(context, 'detail', definition, pane)).toEqual({
		status: 'completed',
	})
	const starting = vi.fn(({ direction }) => ({ translateX: direction === 'back' ? -20 : 20 }))
	const reverse = defineAppKitTransition({ from: starting, duration: 0 })
	await createAppKitRouteTransitions().run(
		{ ...context, action: 'back', direction: 'back' },
		'detail',
		reverse,
		pane,
	)
	expect(starting).toHaveBeenCalledWith(
		expect.objectContaining({ direction: 'back', action: 'back' }),
	)
	expect(Object.isFrozen(definition)).toBe(true)
})

it('skips disabled, unavailable, foreign and reduced-motion definitions', async () => {
	const effect = createAppKitRouteTransitions()
	const definition = defineAppKitTransition({ from: { opacity: 0 } })
	for (const name of [undefined, 'none']) {
		expect(await effect.run(context, name, definition, view())).toEqual({
			status: 'skipped',
			reason: 'disabled',
		})
	}
	expect(await effect.run({ ...context, action: 'refresh' }, 'detail', definition, view())).toEqual(
		{ status: 'skipped', reason: 'disabled' },
	)
	expect(await effect.run(context, 'detail', { ...definition }, view())).toEqual({
		status: 'skipped',
		reason: 'unsupported',
	})
	expect(await effect.run(context, 'detail', definition, null)).toEqual({
		status: 'skipped',
		reason: 'unsupported',
	})
	expect(await effect.run(context, 'detail', { kind: 'web', options: {} }, view())).toEqual({
		status: 'skipped',
		reason: 'unsupported',
	})
	reduced = true
	expect(await effect.run(context, 'detail', definition, view())).toEqual({
		status: 'skipped',
		reason: 'reduced-motion',
	})
	const allowed = effect.run(
		context,
		'detail',
		defineAppKitTransition({ from: { opacity: 0 }, duration: 16, reducedMotion: 'allow' }),
		view(),
	)
	await vi.advanceTimersByTimeAsync(16)
	expect(await allowed).toEqual({ status: 'completed' })
})

it('settles a live reduced-motion change and restores the pane', async () => {
	const pane = view()
	const finished = createAppKitRouteTransitions().run(
		context,
		'detail',
		defineAppKitTransition({ from: { opacity: 0 }, duration: 1000 }),
		pane,
	)
	reduced = true
	await vi.advanceTimersByTimeAsync(16)
	expect(await finished).toEqual({ status: 'completed' })
	expect(pane.alphaValue).toBe(1)
	expect(vi.getTimerCount()).toBe(0)
})

it('contains factory and native-write failures without rejecting completion', async () => {
	const error = new Error('bad factory')
	const definition = defineAppKitTransition({
		from() {
			throw error
		},
	})
	expect(await createAppKitRouteTransitions().run(context, 'detail', definition, view())).toEqual({
		status: 'failed',
		error,
	})
	const pane = view()
	Object.defineProperty(pane, 'alphaValue', {
		set() {
			throw error
		},
	})
	const result = await createAppKitRouteTransitions().run(
		context,
		'detail',
		defineAppKitTransition({ from: { opacity: 0 } }),
		pane,
	)
	expect(result.status).toBe('failed')
	expect(vi.getTimerCount()).toBe(0)
})

it('does not start controllers if the definition disposes its owning flow', async () => {
	const effect = createAppKitRouteTransitions()
	const pane = view()
	const definition = defineAppKitTransition({
		from() {
			effect.interrupt()
			return { opacity: 0 }
		},
	})
	expect(await effect.run(context, 'detail', definition, pane)).toEqual({
		status: 'skipped',
		reason: 'interrupted',
	})
	expect(pane.alphaValue).toBe(1)
	expect(vi.getTimerCount()).toBe(0)
})

it('rejects malformed JavaScript options and validates dynamic starting values', async () => {
	for (const from of [
		null,
		[],
		{ opacity: 2 },
		{ translateX: NaN },
		{ unknown: 1 },
		{ opacity: 'zero' },
	]) {
		expect(() => Reflect.apply(defineAppKitTransition, undefined, [{ from }])).toThrow()
	}
	for (const duration of [-1, NaN, Infinity]) {
		expect(() => defineAppKitTransition({ from: {}, duration })).toThrow()
	}
	const bad = Reflect.apply(defineAppKitTransition, undefined, [
		{
			from: async () => {
				throw new Error('async invalid')
			},
		},
	])
	expect((await createAppKitRouteTransitions().run(context, 'detail', bad, view())).status).toBe(
		'failed',
	)
})

it('contains preference read failures in the motion result', async () => {
	const error = new Error('preference bridge unavailable')
	vi.stubGlobal('NSWorkspace', {
		get sharedWorkspace() {
			throw error
		},
	})
	expect(
		await createAppKitRouteTransitions().run(
			context,
			'detail',
			defineAppKitTransition({ from: { opacity: 0 } }),
			view(),
		),
	).toEqual({ status: 'failed', error })
})

it('captures starting getters once and accepts omitted numeric properties', async () => {
	const opacity = vi.fn(() => 0.2)
	const definition = defineAppKitTransition({
		from: {
			get opacity() {
				return opacity()
			},
			translateX: undefined,
		},
		duration: 16,
	})
	const finished = createAppKitRouteTransitions().run(context, 'detail', definition, view())
	await vi.advanceTimersByTimeAsync(16)
	expect(await finished).toEqual({ status: 'completed' })
	expect(opacity).toHaveBeenCalledTimes(1)
})
