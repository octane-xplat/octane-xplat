import { afterEach, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => {
	const animations: Animation[] = []
	class View {
		nativeViewProtected = {}
		opacity = 1
		translateX = 0
		translateY = 0
		scaleX = 1
		scaleY = 1
		rotate = 0
	}
	class Animation {
		definitions: any[]
		isPlaying = false
		complete!: () => void
		fail!: (error: unknown) => void
		cancel = vi.fn(() => {
			this.isPlaying = false
			this.fail(new Error('SDK cancelled'))
		})
		constructor(definitions: any[]) {
			this.definitions = definitions
			animations.push(this)
		}
		play() {
			this.isPlaying = true
			return new Promise<void>((resolve, reject) => {
				this.complete = () => {
					this.isPlaying = false
					resolve()
				}
				this.fail = (error) => {
					this.isPlaying = false
					reject(error)
				}
			})
		}
	}
	return { View, Animation, animations }
})

vi.mock('@nativescript/core', () => sdk)
vi.mock('../../routing/native-route-motion-policy', () => ({ readNativeReducedMotion: () => false }))
import { defineNativeTransition } from '../../routing/native-route-transition'
import { createNativeViewRouteTransitions } from './native-view-route-transition.mobile'
const context = { direction: 'forward' as const, action: 'push' as const, from: null, to: null }
const effect = defineNativeTransition({
	view: {
		from: { opacity: 0, translateX: 24, scaleX: 0.9, scaleY: 0.9, rotate: 5 },
		duration: 300,
		curve: 'linear',
	},
})

afterEach(() => {
	sdk.animations.length = 0
})

it('animates only the owned SDK view and restores neutral values at completion', async () => {
	const driver = createNativeViewRouteTransitions()
	const view = new sdk.View()
	let settled = false
	const finished = driver.run(context, 'detail', effect, view).then((result) => {
		settled = true
		return result
	})
	expect(view).toMatchObject({ opacity: 0, translateX: 24, scaleX: 0.9, rotate: 5 })
	await Promise.resolve()
	expect(settled).toBe(false)
	expect(sdk.animations[0].definitions).toEqual([
		{
			target: view,
			opacity: 1,
			translate: { x: 0, y: 0 },
			scale: { x: 1, y: 1 },
			rotate: 0,
			duration: 300,
			curve: 'linear',
		},
	])
	sdk.animations[0].complete()
	expect(await finished).toEqual({ status: 'completed' })
	expect(view).toMatchObject({ opacity: 1, translateX: 0, scaleX: 1, rotate: 0 })
})

it('settles interruption once and ignores a late engine callback', async () => {
	const driver = createNativeViewRouteTransitions()
	const oldView = new sdk.View()
	const previous = driver.run(context, 'detail', effect, oldView)
	const nextView = new sdk.View()
	const next = driver.run(context, 'detail', effect, nextView)
	expect(await previous).toEqual({ status: 'skipped', reason: 'interrupted' })
	expect(sdk.animations[0].cancel).toHaveBeenCalledOnce()
	expect(oldView.opacity).toBe(1)
	sdk.animations[0].complete()
	expect(nextView.opacity).toBe(0)
	sdk.animations[1].complete()
	expect(await next).toEqual({ status: 'completed' })
})

it('isolates concurrent flow engines and keeps engine failure local to motion', async () => {
	const left = createNativeViewRouteTransitions()
	const right = createNativeViewRouteTransitions()
	const leftView = new sdk.View()
	const rightView = new sdk.View()
	const leftResult = left.run(context, 'detail', effect, leftView)
	const rightResult = right.run(context, 'detail', effect, rightView)
	left.interrupt()
	expect(await leftResult).toMatchObject({ status: 'skipped' })
	expect(rightView.opacity).toBe(0)
	const error = new Error('native engine failed')
	sdk.animations[1].fail(error)
	expect(await rightResult).toEqual({ status: 'failed', error })
	expect(rightView.opacity).toBe(1)
})

it('skips unsupported targets and disabled/refresh effects without starting the engine', async () => {
	const driver = createNativeViewRouteTransitions()
	expect(await driver.run(context, 'detail', effect, {})).toEqual({
		status: 'skipped',
		reason: 'unsupported',
	})
	expect(
		await driver.run({ ...context, action: 'refresh' }, 'detail', effect, new sdk.View()),
	).toEqual({ status: 'skipped', reason: 'disabled' })
	expect(await driver.run(context, 'none', effect, new sdk.View())).toEqual({
		status: 'skipped',
		reason: 'disabled',
	})
	expect(sdk.animations).toHaveLength(0)
})
