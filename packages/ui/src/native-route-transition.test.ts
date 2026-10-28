// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import {
	defineNativeTransition,
	resolveNativePageTransition,
	resolveNativeViewTransition,
} from './native-route-transition'

import { defineTransitions } from './route-transitions'
import type { NativeTransitionContext } from './native-route-transition'
import type { PreparedRouteMatch } from './props'

const state = vi.hoisted(() => ({ reduced: false }))
vi.mock('./native-route-motion-policy', () => ({ readNativeReducedMotion: () => state.reduced }))
afterEach(() => {
	state.reduced = false
})

const route: PreparedRouteMatch = {
	to: '/items/:id',
	name: 'items/:id',
	stack: 'root',
	params: { id: 'coat' },
	search: {},
	context: {},
	data: undefined,
	href: '/items/coat',
}

const context: NativeTransitionContext = { from: null, to: route, action: 'push' }

it('keeps an opaque native factory registered and preserves its engine instance', () => {
	const instance = {
		id: 1,
		getDuration: () => 240,
		setDuration() {},
		getCurve() {},
		animateIOSTransition() {},
		createAndroidAnimator() {},
	}
	const page = vi.fn(() => ({ instance }))
	const registry = defineTransitions({ detail: defineNativeTransition({ page }) })
	const effect = resolveNativePageTransition('detail', registry.detail, context)
	expect(effect.animated).toBe(true)
	expect(effect.transition?.instance).toBe(instance)
	expect(page).toHaveBeenCalledExactlyOnceWith(context)
})

it('samples reduced motion before running a custom factory, with an explicit allow policy', () => {
	state.reduced = true
	const page = vi.fn(() => ({ name: 'slideLeft', duration: 240 }))
	const skipped = resolveNativePageTransition('detail', defineNativeTransition({ page }), context)
	expect(skipped).toEqual({
		animated: false,
		result: { status: 'skipped', reason: 'reduced-motion' },
	})
	expect(page).not.toHaveBeenCalled()
	const allowed = resolveNativePageTransition(
		'detail',
		defineNativeTransition({ page, reducedMotion: 'allow' }),
		context,
	)
	expect(allowed).toEqual({ animated: true, transition: { name: 'slideLeft', duration: 240 } })
})

it('keeps a factory failure separate from navigation and diagnoses unsupported definitions', () => {
	const error = new Error('effect factory failed')
	expect(
		resolveNativePageTransition(
			'detail',
			defineNativeTransition({
				page: () => {
					throw error
				},
			}),
			context,
		),
	).toEqual({ animated: false, result: { status: 'failed', error } })
	expect(resolveNativePageTransition('detail', { kind: 'web', options: {} }, context)).toEqual({
		animated: false,
		result: { status: 'skipped', reason: 'unsupported' },
	})
	expect(resolveNativePageTransition('unknown', undefined, context)).toEqual({
		animated: false,
		result: { status: 'skipped', reason: 'unsupported' },
	})
})

it('retains built-in native presets and explicit no-motion choices', () => {
	expect(resolveNativePageTransition('fade', undefined, context)).toEqual({
		animated: true,
		transition: { name: 'fade' },
	})
	expect(resolveNativePageTransition('none', undefined, context)).toEqual({
		animated: false,
		result: { status: 'skipped', reason: 'disabled' },
	})
	expect(resolveNativePageTransition('detail', { kind: 'skip' }, context)).toEqual({
		animated: false,
		result: { status: 'skipped', reason: 'disabled' },
	})
})

it('reports an untyped asynchronous factory without leaking its rejection', async () => {
	const definition = Reflect.apply(defineNativeTransition, undefined, [
		{
			page: async () => {
				throw new Error('late factory failure')
			},
		},
	])
	const result = resolveNativePageTransition('detail', definition, context)
	expect(result.animated).toBe(false)
	expect(result.result?.status).toBe('failed')
	if (result.result?.status === 'failed') {
		expect(result.result.error).toBeInstanceOf(TypeError)
	}
	await Promise.resolve()
})

it('keeps page and view engines distinct and captures flat view values immutably', () => {
	const from = { opacity: 0, translateX: 24 }
	const viewOnly = defineNativeTransition({ view: { from, duration: 180, curve: 'easeOut' } })
	from.translateX = 900
	expect(resolveNativePageTransition('detail', viewOnly, context).result).toEqual({
		status: 'skipped',
		reason: 'unsupported',
	})
	expect(
		resolveNativeViewTransition('detail', viewOnly, { ...context, direction: 'forward' }),
	).toEqual({ values: { opacity: 0, translateX: 24 }, duration: 180, curve: 'easeOut' })
	const pageOnly = defineNativeTransition({ page: () => ({ name: 'fade' }) })
	expect(
		resolveNativeViewTransition('detail', pageOnly, { ...context, direction: 'forward' }),
	).toEqual({ status: 'skipped', reason: 'unsupported' })
})

it('supplies Back context to view effects and samples their reduced motion policy', () => {
	const from = vi.fn(({ direction }: { direction: 'forward' | 'back' }) => ({
		translateX: direction === 'back' ? -24 : 24,
	}))
	const definition = defineNativeTransition({ view: { from } })
	const back = { ...context, direction: 'back' as const, action: 'back' as const }
	expect(resolveNativeViewTransition('detail', definition, back)).toMatchObject({
		values: { translateX: -24 },
	})
	state.reduced = true
	from.mockClear()
	expect(resolveNativeViewTransition('detail', definition, back)).toEqual({
		status: 'skipped',
		reason: 'reduced-motion',
	})
	expect(from).not.toHaveBeenCalled()
	expect(
		resolveNativeViewTransition(
			'detail',
			defineNativeTransition({ view: { from }, reducedMotion: 'allow' }),
			back,
		),
	).toMatchObject({ values: { translateX: -24 } })
})

it('rejects invalid static values and keeps callback failures local to motion', async () => {
	for (const options of [
		{},
		{ view: { from: { opacity: 2 } } },
		{ view: { from: { translateX: Infinity } } },
		{ view: { from: { opacity: 0 }, duration: -1 } },
		{ view: { from: { target: {} } } },
		{ view: { from: { opacity: 0 }, curve: 'invented' } },
	]) {
		expect(() => Reflect.apply(defineNativeTransition, undefined, [options])).toThrow(TypeError)
	}
	const definition = Reflect.apply(defineNativeTransition, undefined, [
		{
			view: {
				from: async () => {
					throw new Error('late failure')
				},
			},
		},
	])
	expect(
		resolveNativeViewTransition('detail', definition, { ...context, direction: 'forward' }),
	).toMatchObject({ status: 'failed', error: expect.any(TypeError) })
	await Promise.resolve()
})
