import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Controller } from './controller'
import { delegatedRun } from './driver.web'
import { attachHost } from './host.web'
import type { Clock } from './clock-types'
import type { Target } from './types'

function fakeClock() {
	let time = 0,
		id = 0

	const callbacks = new Map<number, () => void>()
	const clock: Clock = {
		now: () => time,
		request: (fn) => {
			callbacks.set(++id, fn)
			return id
		},
		cancel: (key) => {
			callbacks.delete(key)
		},
	}

	return {
		clock,
		advance(ms: number) {
			time += ms
			const pending = [...callbacks.values()]
			callbacks.clear()
			pending.forEach((fn) => fn())
		},
		count: () => callbacks.size,
	}
}

// Web delegated driver — jsdom ships no `element.animate`, so a fake
// Animation models the browser: `presented` stands in for the animation
// cascade over the element's base styles, and cancel() reveals the base
// again like a real reverted WAAPI run.
function styleToMatrix(style: string): string {
	if (!style || style === 'none' || style.startsWith('matrix')) {
		return style || 'none'
	}

	const channel = (name: string, dflt: number) => {
		const match = new RegExp(`${name}\\((-?[\\d.eE+-]+)`).exec(style)
		return match ? Number.parseFloat(match[1]) : dflt
	}

	const x = channel('translateX', 0)
	const y = channel('translateY', 0)
	const sx = channel('scale', 1) * channel('scaleX', 1)
	const sy = channel('scale', 1) * channel('scaleY', 1)
	const rad = (channel('rotate', 0) * Math.PI) / 180
	return `matrix(${sx * Math.cos(rad)}, ${sy * Math.sin(rad)}, ${-sx * Math.sin(rad)}, ${sy * Math.cos(rad)}, ${x}, ${y})`
}

function fakeWebElement() {
	const animations: any[] = []
	let presented: { transform?: string; opacity?: string } | null = null
	const el: any = {
		style: { transform: '', opacity: '', transformOrigin: '' },
	}

	el.animate = (keyframes: any[], options: any) => {
		let resolve!: (value: any) => void
		let reject!: (reason: any) => void
		const animation: any = {
			keyframes,
			options,
			cancelled: false,
			finished: new Promise((res, rej) => {
				resolve = res
				reject = rej
			}),
			present(transform: string, opacity?: string) {
				presented = { transform, opacity }
			},
			finish() {
				const last = keyframes[keyframes.length - 1] ?? {}
				presented = {
					transform: last.transform,
					opacity: last.opacity === undefined ? undefined : String(last.opacity),
				}

				resolve(animation)
			},
			cancel() {
				animation.cancelled = true
				presented = null
				reject(new Error('AbortError'))
			},
		}

		animations.push(animation)
		return animation
	}

	const computedFor = (node: any) => ({
		transform: node === el ? (presented?.transform ?? styleToMatrix(el.style.transform)) : 'none',
		opacity:
			node === el
				? (presented?.opacity ?? (el.style.opacity === '' ? '1' : el.style.opacity))
				: '1',
		transformOrigin: node === el ? el.style.transformOrigin || '0px 0px' : '0px 0px',
	})

	vi.stubGlobal('getComputedStyle', computedFor)
	return { el, animations }
}

const delegationCounters = () =>
	((globalThis as any).__xplatMotionDelegations ??= {
		started: 0,
		finished: 0,
		cancelled: 0,
		fallback: 0,
	})

describe('web WAAPI delegation', () => {
	beforeEach(() => {
		delete (globalThis as any).__xplatMotionDelegations
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	const request = (target: Target, transition: any = { duration: 0.5, ease: 'easeOut' }) => ({
		target,
		dest: { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, ...target },
		eff: { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, ...target },
		transition,
	})

	it('hands a bezier tween to element.animate and commits the destination on finish', async () => {
		const { el, animations } = fakeWebElement()
		const written: Target[] = []
		const run = delegatedRun(
			el,
			request({ x: 100, opacity: 0.5 }, { duration: 0.5, delay: 0.1, ease: 'easeOut' }),
			(target) => written.push({ ...target }),
		)

		expect(run).not.toBeNull()
		expect(animations).toHaveLength(1)
		const animation = animations[0]
		expect(animation.options).toMatchObject({
			duration: 500,
			delay: 100,
			easing: 'cubic-bezier(0, 0, 0.58, 1)',
			fill: 'forwards',
		})

		expect(animation.keyframes[0].transform).toBe(
			'translateX(0px) translateY(0px) scaleX(1) scaleY(1) rotate(0deg)',
		)

		expect(animation.keyframes[1].transform).toBe(
			'translateX(100px) translateY(0px) scaleX(1) scaleY(1) rotate(0deg)',
		)

		expect(animation.keyframes[1].opacity).toBe(0.5)
		expect(delegationCounters().started).toBe(1)

		animation.present('matrix(1, 0, 0, 1, 40, 0)')
		expect(run!.sample()).toMatchObject({ x: 40, scaleX: 1 })
		animation.finish()
		await expect(run!.finished).resolves.toBe('finished')
		expect(written.at(-1)).toMatchObject({ x: 100, opacity: 0.5 })
		expect(delegationCounters().finished).toBe(1)
	})

	it('samples the presentation before cancelling so the frozen values hold', async () => {
		const { el, animations } = fakeWebElement()
		const written: Target[] = []
		const run = delegatedRun(el, request({ x: 100 }), (target) => written.push({ ...target }))

		const animation = animations[0]
		animation.present('matrix(0.5, 0, 0, 0.5, 42, 7)')
		run!.cancel()
		expect(animation.cancelled).toBe(true)
		// cancel() reveals the base style — if the sample ran after it, the
		// write would carry identity values instead of the mid-flight frame.
		expect(written.at(-1)).toMatchObject({ x: 42, y: 7, scaleX: 0.5, scaleY: 0.5, rotate: 0 })
		await expect(run!.finished).resolves.toBe('cancelled')
		expect(delegationCounters().cancelled).toBe(1)
	})

	it('decomposes matrix3d and peels transform-origin out of x/y', () => {
		const { el, animations } = fakeWebElement()
		el.style.transformOrigin = '10px 20px'
		const run = delegatedRun(el, request({ rotate: 90 }), () => {})

		const animation = animations[0]
		animation.present('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 25, 5, 0, 1)')
		expect(run!.sample()).toMatchObject({ x: 25, y: 5, scaleX: 1, scaleY: 1, rotate: 0 })
		// rotate(90deg) about a (10, 20) origin resolves to this matrix.
		animation.present('matrix(0, 1, -1, 0, 30, 10)')
		const sampled = run!.sample()
		expect(sampled.rotate).toBeCloseTo(90)
		expect(sampled.x).toBeCloseTo(0)
		expect(sampled.y).toBeCloseTo(0)
	})

	it('refuses non-bezier eases and elements without a WAAPI driver', () => {
		const { el } = fakeWebElement()
		const run = delegatedRun(el, request({ x: 100 }, { duration: 0.5, ease: 'backOut' }), () => {})

		expect(run).toBeNull()
		expect(delegatedRun({ style: {} }, request({ x: 50 }), () => {})).toBeNull()
		expect(delegationCounters().fallback).toBe(2)
		expect(delegationCounters().started).toBe(0)
	})

	it('delegates through the real web adapter and hands mid-flight state to the next run', async () => {
		const { el, animations } = fakeWebElement()
		const time = fakeClock()
		const controller = new Controller(time.clock)
		controller.attach(attachHost(el))
		controller.seed({ x: 0 })

		const doneFirst = controller.animate({ x: 100 }, { duration: 0.5, ease: 'linear' }, false)
		expect(animations).toHaveLength(1)
		animations[0].present('matrix(1, 0, 0, 1, 30, 0)')
		time.advance(16)

		const doneSecond = controller.animate({ x: -50 }, { duration: 0.5 }, false)
		expect(animations[0].cancelled).toBe(true)
		// Interruption sampled into the channel value and velocity.
		expect(controller.values.get('x')?.get()).toBe(30)
		expect(controller.values.get('x')?.getVelocity()).toBeGreaterThan(0)
		// The replacement run's "from" keyframe continues the frozen frame.
		expect(animations[1].keyframes[0].transform).toBe(
			'translateX(30px) translateY(0px) scaleX(1) scaleY(1) rotate(0deg)',
		)

		expect(await doneFirst).toBe('replaced')
		animations[1].finish()
		expect(await doneSecond).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(-50)
		expect(el.style.transform).toBe(
			'translateX(-50px) translateY(0px) scale(1) scaleX(1) scaleY(1) rotate(0deg)',
		)
	})

	it.each([
		['a spring', { type: 'spring', stiffness: 100, damping: 10 }, false],
		['a non-bezier ease', { duration: 0.5, ease: 'backOut' as const }, false],
		['a repeating run', { duration: 0.5, repeat: 2 }, false],
		['per-key transitions', { default: { duration: 0.5 }, x: { duration: 1 } }, false],
		['an instant run', { duration: 0 }, false],
		['reduced motion', { duration: 0.5 }, true],
	])('stays on the JS engine for %s', async (_label, transition, reduced) => {
		const { el, animations } = fakeWebElement()
		const time = fakeClock()
		const controller = new Controller(time.clock)
		controller.attach(attachHost(el))
		controller.seed({ x: 0 })

		const done = controller.animate({ x: 100 }, transition as any, reduced)
		expect(animations).toHaveLength(0)
		for (let i = 0; i < 500; i++) {
			time.advance(16)
		}

		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(100)
	})
})
