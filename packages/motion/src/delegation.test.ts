import { describe, expect, it } from 'vitest'
import { Controller } from './controller'
import type { Clock } from './clock-types'
import type { DelegatedRequest, DelegatedRun, HostAdapter } from './host-types'
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

interface FakeRun extends DelegatedRun {
	resolve(result: 'finished' | 'cancelled'): void
	setEff(next: Target): void
	cancelCalls: number
}

function fakeRun(eff: Target): FakeRun {
	let resolve!: (result: 'finished' | 'cancelled') => void
	let current = { ...eff }
	const run: FakeRun = {
		finished: new Promise((done) => {
			resolve = done
		}),
		sample: () => ({ ...current }),
		cancelCalls: 0,
		cancel() {
			run.cancelCalls++
			run.resolve('cancelled')
		},
		resolve,
		setEff(next) {
			current = { ...next }
		},
	}

	return run
}

function stubHost(onDelegate?: (req: DelegatedRequest) => DelegatedRun | null) {
	const written: Target[] = []
	const adapter: HostAdapter = {
		read: () => ({ opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0 }),
		write: (target) => {
			written.push({ ...target })
		},
		restore: () => {},
		delegate: onDelegate,
	}

	return { adapter, written }
}

describe('delegated runs', () => {
	it('hands a tween to the host driver and resolves finished at the destination', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		let request: DelegatedRequest | undefined
		const run = fakeRun({ x: 0 })
		const { adapter } = stubHost((req) => {
			request = req
			return run
		})

		controller.attach(adapter)
		controller.seed({ x: 0 })

		const done = controller.animate({ x: 100 }, { duration: 0.5 }, false)
		expect(request?.eff.x).toBe(100)
		expect(request?.target.x).toBe(100)

		run.setEff({ x: 40 })
		time.advance(16)
		run.resolve('finished')
		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(100)
		expect(time.count()).toBe(0)
	})

	it('folds scale into the effective axis and tracks samples back', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		let request: DelegatedRequest | undefined
		const run = fakeRun({ scaleX: 0.5, scaleY: 0.5 })
		const { adapter } = stubHost((req) => {
			request = req
			return run
		})

		controller.attach(adapter)
		controller.seed({ scaleX: 0.5 })

		const done = controller.animate({ scale: 2 }, { duration: 0.4 }, false)
		// Retained scaleX=0.5 folds into the effective destination.
		expect(request?.eff.scaleX).toBe(1)
		expect(request?.eff.scaleY).toBe(2)
		run.setEff({ scaleX: 0.9, scaleY: 0.9 })
		time.advance(16)
		// scale channel tracks effective / retained scaleX.
		expect(controller.values.get('scale')?.get()).toBeCloseTo(1.8)
		run.resolve('finished')
		expect(await done).toBe('finished')
		expect(controller.values.get('scale')?.get()).toBe(2)
	})

	it('interrupts a delegated run with a tracked sample and resolves replaced', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		const first = fakeRun({ x: 0 })
		const second = fakeRun({ x: 30 })
		const runs = [first, second]
		let calls = 0
		const { adapter } = stubHost(() => runs[calls++ % runs.length])
		controller.attach(adapter)
		controller.seed({ x: 0 })

		const doneFirst = controller.animate({ x: 100 }, { duration: 0.5 }, false)
		first.setEff({ x: 30 })
		time.advance(16)
		const doneSecond = controller.animate({ x: -50 }, { duration: 0.5 }, false)
		expect(first.cancelCalls).toBe(1)
		// The interruption sample is written into the channel value.
		expect(controller.values.get('x')?.get()).toBe(30)
		expect(await doneFirst).toBe('replaced')
		second.setEff({ x: -20 })
		time.advance(16)
		expect(controller.values.get('x')?.get()).toBe(-20)
		second.resolve('finished')
		expect(await doneSecond).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(-50)
	})

	it('keeps springs on the JS engine', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		let delegated = false
		const { adapter } = stubHost(() => {
			delegated = true
			return null
		})

		controller.attach(adapter)
		controller.seed({ x: 0 })

		const done = controller.animate(
			{ x: 100 },
			{ type: 'spring', stiffness: 100, damping: 10 },
			false,
		)

		expect(delegated).toBe(false)
		for (let i = 0; i < 400; i++) {
			time.advance(16)
		}

		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(100)
	})

	it('keeps reduced-motion runs on the JS engine for instant settle', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		let delegated = false
		const { adapter, written } = stubHost(() => {
			delegated = true
			return null
		})

		controller.attach(adapter)
		controller.seed({ x: 0 })

		const done = controller.animate({ x: 50 }, { duration: 0.5 }, true)
		expect(delegated).toBe(false)
		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(50)
		expect(written[written.length - 1]?.x).toBe(50)
	})

	it('resolves replaced when the delegated run is stopped', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		const run = fakeRun({ x: 0 })
		const { adapter } = stubHost(() => run)
		controller.attach(adapter)
		controller.seed({ x: 0 })

		const done = controller.animate({ x: 100 }, { duration: 0.5 }, false)
		controller.stop()
		expect(run.cancelCalls).toBe(1)
		expect(await done).toBe('replaced')
	})

	it.each([
		['per-key transitions', { default: { duration: 0.5 }, x: { duration: 1 } }],
		['a non-bezier ease', { duration: 0.5, ease: 'backOut' as const }],
		['a repeating run', { duration: 0.5, repeat: 2 }],
	])('stays on the JS engine for %s', async (_label, transition) => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		let delegated = false
		const { adapter } = stubHost(() => {
			delegated = true
			return null
		})

		controller.attach(adapter)
		controller.seed({ x: 0 })

		const done = controller.animate({ x: 100 }, transition as any, false)
		expect(delegated).toBe(false)
		for (let i = 0; i < 500; i++) {
			time.advance(16)
		}

		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(100)
	})

	it('applies per-key overrides to each channel independently', async () => {
		const time = fakeClock()
		const controller = new Controller(time.clock)
		const { adapter } = stubHost()
		controller.attach(adapter)
		controller.seed({ x: 0, y: 0 })

		const done = controller.animate(
			{ x: 100, y: 100 },
			{ default: { duration: 0.1, ease: 'linear' }, x: { duration: 0.3 } },
			false,
		)

		for (let i = 0; i < 8; i++) {
			time.advance(16)
		}

		// y finished at 100ms; x still travelling on its 300ms override.
		expect(controller.values.get('y')?.get()).toBe(100)
		expect(controller.values.get('x')?.get()).toBeLessThan(100)
		for (let i = 0; i < 30; i++) {
			time.advance(16)
		}

		expect(await done).toBe('finished')
		expect(controller.values.get('x')?.get()).toBe(100)
	})
})
