import { describe, expect, it } from 'vitest'
import { spring } from 'motion-dom'
import { runAnimation } from './engine'
import { MotionValue } from './value'
import { Controller } from './controller'
import type { Clock } from './clock-types'

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

describe('portable playback', () => {
	it('uses elapsed time and reaches the exact tween endpoint after suspension', async () => {
		const time = fakeClock()
		let value = 0
		const controls = runAnimation(
			time.clock,
			0,
			100,
			{ duration: 1, delay: 0.1, ease: 'linear' },
			(next) => {
				value = next
			},
		)

		time.advance(50)
		expect(value).toBe(0)
		time.advance(550)
		expect(value).toBeCloseTo(50)
		time.advance(10000)
		expect(value).toBe(100)
		expect(await controls.finished).toBe('finished')
		expect(time.count()).toBe(0)
	})

	it('matches upstream spring samples at irregular frame intervals', () => {
		const time = fakeClock()
		let value = 0
		const options = { stiffness: 180, damping: 16, mass: 2, velocity: 90 }
		const reference = spring({ ...options, keyframes: [0, 100] })
		runAnimation(time.clock, 0, 100, { ...options, type: 'spring' }, (next) => {
			value = next
		})

		let elapsed = 0
		for (const dt of [8, 16, 34, 5, 100, 10000]) {
			elapsed += dt
			time.advance(dt)
			const expected = reference.next(elapsed)
			expect(value).toBeCloseTo(expected.done ? 100 : expected.value)
		}

		expect(value).toBe(100)
	})

	it('settles cancellation once and never calls completion', async () => {
		const time = fakeClock()
		let completes = 0
		const controls = runAnimation(
			time.clock,
			0,
			1,
			{},
			() => {},
			() => {
				completes++
			},
		)

		controls.stop()
		controls.stop()
		time.advance(1000)
		expect(await controls.finished).toBe('cancelled')
		expect(completes).toBe(0)
	})

	it('preserves velocity on retarget and jump cancels/reset velocity', async () => {
		const time = fakeClock()
		const value = new MotionValue(0, time.clock)
		const first = value.animate(100, { type: 'spring' })
		time.advance(16)
		time.advance(16)
		expect(value.getVelocity()).toBeGreaterThan(0)
		const second = value.animate(0, { type: 'spring' })
		expect(await first.finished).toBe('replaced')
		value.jump(25)
		expect(value.get()).toBe(25)
		expect(value.getVelocity()).toBe(0)
		expect(await second.finished).toBe('cancelled')
		expect(time.count()).toBe(0)
	})

	it('cleans every channel on controller disposal', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		const result = controller.animate({ x: 40, opacity: 0 }, { duration: 1 }, false)
		controller.destroy()
		time.advance(1000)
		expect(await result).toBe('replaced')
		expect(time.count()).toBe(0)
	})

	it('reduces positional springs immediately while preserving opacity motion', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		const result = controller.animate({ x: 100, opacity: 0 }, { type: 'spring' }, true)

		expect(controller.snapshot()).toMatchObject({ x: 100, opacity: 1 })
		expect(time.count()).toBe(1)
		time.advance(10000)
		expect(await result).toBe('finished')
		expect(controller.snapshot()).toEqual({ x: 100, opacity: 0 })
		controller.destroy()
	})
})

describe('upstream-shaped transitions', () => {
	it('repeats a tween for the given number of additional legs', async () => {
		const time = fakeClock()
		const seen: number[] = []
		const controls = runAnimation(
			time.clock,
			0,
			100,
			{ duration: 0.1, ease: 'linear', repeat: 1 },
			(value) => seen.push(value),
		)

		time.advance(120)
		expect(seen.at(-1)).toBe(100)
		time.advance(50)
		expect(seen.at(-1)).toBe(50)
		time.advance(120)
		expect(seen.at(-1)).toBe(100)
		expect(await controls.finished).toBe('finished')
	})

	it('reverses each repeated leg under repeatType reverse', async () => {
		const time = fakeClock()
		const seen: number[] = []
		const controls = runAnimation(
			time.clock,
			0,
			100,
			{ duration: 0.1, ease: 'linear', repeat: 1, repeatType: 'reverse' },
			(value) => seen.push(value),
		)

		time.advance(120)
		time.advance(50)
		expect(seen.at(-1)).toBe(50)
		time.advance(120)
		expect(seen.at(-1)).toBe(0)
		expect(await controls.finished).toBe('finished')
	})

	it('accepts a duration/bounce spring spec', async () => {
		const time = fakeClock()
		let value = 0
		const controls = runAnimation(
			time.clock,
			0,
			100,
			{ type: 'spring', duration: 0.4, bounce: 0.2 },
			(next) => {
				value = next
			},
		)

		for (let i = 0; i < 100; i++) {
			time.advance(16)
		}

		expect(await controls.finished).toBe('finished')
		expect(value).toBe(100)
	})

	it('accepts the full named-ease set on the JS engine', async () => {
		for (const ease of ['circIn', 'backOut', 'anticipate', 'circInOut', 'backInOut'] as const) {
			const time = fakeClock()
			let value = 0
			const controls = runAnimation(time.clock, 0, 50, { duration: 0.1, ease }, (next) => {
				value = next
			})

			for (let i = 0; i < 20; i++) {
				time.advance(16)
			}

			expect(await controls.finished).toBe('finished')
			expect(value).toBe(50)
		}
	})

	it('rejects fractional repeats', () => {
		const time = fakeClock()
		expect(() => runAnimation(time.clock, 0, 1, { duration: 1, repeat: 1.5 }, () => {})).toThrow(
			'repeat',
		)
	})
})
