import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAnimatedValue } from '../src/animated-value.ts'
import { writeAnimatedProperty, readReducedMotion } from '../src/animation-host.macos.ts'

function fixture(initial = 0) {
	let now = 0,
		id = 0,
		reduced = false

	const frames = new Map(),
		cancelled = []

	const writes = []
	const value = createAnimatedValue(initial, {
		now: () => now,
		request: (cb) => {
			frames.set(++id, cb)
			return id
		},
		cancel: (key) => {
			cancelled.push(frames.get(key))
			frames.delete(key)
		},
		write: (_, next) => writes.push(next),
		reducedMotion: () => reduced,
	})

	value.ref({})
	return {
		value,
		frames,
		writes,
		cancelled,
		reduce: () => {
			reduced = true
		},
		tick(ms) {
			now += ms
			const pending = [...frames.values()]
			frames.clear()
			for (const cb of pending) {
				cb()
			}
		},
	}
}

test('tween samples elapsed time, replaces playback, and settles exactly', () => {
	const f = fixture()
	f.value.to(100, { duration: 200 })
	assert.equal(f.value.value, 0)
	f.tick(50)
	assert.equal(f.value.value, 25)
	f.value.to(-50, { duration: 100 })
	f.tick(50)
	assert.equal(f.value.value, -12.5)
	f.tick(5000)
	assert.equal(f.value.value, -50)
	assert.equal(f.frames.size, 0)
	f.value.to(9, { duration: 0 })
	assert.equal(f.value.value, 9)
})

test('springs are time based for under, critical and over damping', () => {
	for (const damping of [14, 2 * Math.sqrt(120), 40]) {
		const a = fixture(),
			b = fixture()

		a.value.spring(100, { damping })
		b.value.spring(100, { damping })
		for (let i = 0; i < 6; i++) {
			a.tick(16)
		}

		b.tick(96)
		assert.ok(Math.abs(a.value.value - b.value.value) < 1e-9)
		assert.ok(b.value.value > 0 && b.value.value < 100)
		a.tick(10000)
		assert.equal(a.value.value, 100)
		assert.equal(a.frames.size, 0)
	}
})

test('stop, detach and disposal reject stale callbacks and subsequent runs', () => {
	const f = fixture()
	f.value.spring(100)
	f.tick(32)
	const stopped = f.value.value,
		stale = [...f.frames.values()][0]

	f.value.stop()
	stale()
	f.tick(1000)
	assert.equal(f.value.value, stopped)
	f.value.to(50)
	f.value.ref(null)
	f.tick(1000)
	assert.equal(f.value.value, stopped)
	f.value.ref({})
	f.value.to(70)
	f.value.dispose()
	const count = f.writes.length
	f.value.ref({})
	f.value.spring(80)
	f.value.to(90, { duration: 0 })
	f.tick(1000)
	assert.equal(f.writes.length, count)
	assert.equal(f.frames.size, 0)
})

test('reduced motion snaps on start and preference change during playback', () => {
	const f = fixture()
	f.value.to(100)
	f.tick(16)
	f.reduce()
	f.tick(16)
	assert.equal(f.value.value, 100)
	assert.equal(f.frames.size, 0)
	f.value.spring(0)
	assert.equal(f.value.value, 0)
	assert.equal(f.frames.size, 0)
})

test('invalid parameters fail without interrupting a valid run', () => {
	const f = fixture()
	f.value.to(100)
	assert.throws(() => f.value.to(1, { duration: -1 }))
	assert.throws(() => f.value.spring(1, { stiffness: 0 }))
	assert.throws(() => f.value.to(NaN))
	f.tick(300)
	assert.equal(f.value.value, 100)
})

test('AppKit maps native properties, units and reduced motion', () => {
	const samples = [],
		actions = []

	globalThis.CATransaction = {
		begin: () => actions.push('begin'),
		setDisableActions: (v) => actions.push(v),
		commit: () => actions.push('commit'),
	}

	globalThis.NSWorkspace = { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: true } }
	const view = { layer: { setValueForKeyPath: (v, key) => samples.push([key, v]) } }
	writeAnimatedProperty(view, 'opacity', 0.4)
	assert.equal(view.alphaValue, 0.4)
	writeAnimatedProperty(view, 'translateY', 12)
	assert.deepEqual(samples[0], ['transform.translation.y', -12])
	writeAnimatedProperty(view, 'rotate', 180)
	assert.deepEqual(samples[1], ['transform.rotation.z', Math.PI])
	assert.deepEqual(actions.slice(0, 3), ['begin', true, 'commit'])
	assert.equal(readReducedMotion(), true)
	assert.throws(() => writeAnimatedProperty(view, 'unknown', 1), /unsupported/)
	delete globalThis.CATransaction
	delete globalThis.NSWorkspace
})
