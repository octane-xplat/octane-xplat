import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createHaptics } from '../src/haptics.web.ts'

const globals = globalThis as any
const nativeNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

const installVibrate = () => {
	const calls: unknown[] = []
	Object.defineProperty(globalThis, 'navigator', {
		configurable: true,
		value: {
			vibrate: (pattern: number | readonly number[]) => {
				calls.push(pattern)
				return true
			},
		},
	})

	return calls
}

afterEach(() => {
	if (nativeNavigator) {
		Object.defineProperty(globalThis, 'navigator', nativeNavigator)
	} else {
		delete globals.navigator
	}
})

test('playPattern emits pause-then-vibrate pairs preserving authored timing', () => {
	const calls = installVibrate()
	const engine = createHaptics()
	assert.equal(
		engine.playPattern({
			duration: 1000,
			points: [
				{ at: 100, intensity: 0 },
				{ at: 300, intensity: 1 },
			],
		}),
		true,
	)

	// [vibrate, pause, ...]: silence to t=100, a 10ms min-intensity buzz,
	// pause until t=300 (accounting for the emitted pulse), then a 50ms buzz.
	assert.deepEqual(calls, [[0, 100, 10, 190, 50]])
})

test('playPattern clips points and pulses to the duration envelope', () => {
	const calls = installVibrate()
	const engine = createHaptics()
	assert.equal(
		engine.playPattern({
			duration: 120,
			points: [
				{ at: 100, intensity: 1 },
				{ at: 200, intensity: 0.5 },
			],
		}),
		true,
	)

	// The 50ms max-intensity pulse is clipped to the 20ms left in the
	// envelope, and the t=200 point beyond it does not emit at all.
	assert.deepEqual(calls, [[0, 100, 20]])
})

test('playPattern reports false when nothing can play', () => {
	const calls = installVibrate()
	const engine = createHaptics()
	assert.equal(engine.playPattern({ duration: 100, points: [] }), false)
	assert.equal(
		engine.playPattern({
			duration: 100,
			points: [{ at: Number.NaN, intensity: 1 }],
		}),
		false,
	)

	assert.deepEqual(calls, [])
	engine.dispose()
	assert.equal(
		engine.playPattern({ duration: 100, points: [{ at: 0, intensity: 1 }] }),
		false,
	)

	// dispose cancels any in-flight vibration but plays nothing new.
	assert.deepEqual(calls, [0])
})

test('capabilities report unsupported without the Vibration API', () => {
	delete globals.navigator
	const engine = createHaptics()
	assert.equal(engine.capabilities().supported, false)
	assert.equal(engine.capabilities().realtime, false)
	assert.equal(engine.play('selection'), false)
	assert.equal(engine.playPattern({ duration: 10, points: [{ at: 0, intensity: 1 }] }), false)
})
