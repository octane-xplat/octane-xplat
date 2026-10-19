import assert from 'node:assert/strict'
import test from 'node:test'
import { createKeyboardWindowRegistry } from '../src/keyboard-registry.ts'

function source(initial = 0) {
	const attached = []
	const observe = (window, publish) => {
		const entry = { window, publish, stopped: 0 }
		attached.push(entry)
		publish(typeof initial === 'function' ? initial(window) : initial)
		return () => entry.stopped++
	}
	return { observe, attached }
}

test('windows share their own observer, replay current state, and release the final reader', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const native = source()
	const remove = registry.install(native.observe, 'fallback')
	const a = {},
		b = {},
		first = [],
		late = [],
		other = []
	assert.equal(registry.getSnapshot(a), 0)
	assert.equal(native.attached.length, 0)
	const offA = registry.subscribe(a, (value) => first.push(value))
	const offB = registry.subscribe(b, (value) => other.push(value))
	native.attached[0].publish(280)
	const offLate = registry.subscribe(a, (value) => late.push(value))
	assert.equal(native.attached.length, 2)
	assert.deepEqual(first, [0, 280])
	assert.deepEqual(late, [280])
	assert.deepEqual(other, [0])
	offA()
	offA()
	assert.equal(native.attached[0].stopped, 0)
	native.attached[0].publish(100)
	assert.deepEqual(first, [0, 280])
	assert.deepEqual(late, [280, 100])
	offLate()
	assert.equal(native.attached[0].stopped, 1)
	native.attached[0].publish(999)
	assert.equal(registry.getSnapshot(a), 0)
	assert.equal(registry.getSnapshot(b), 0)
	offB()
	remove()
	assert.equal(native.attached[1].stopped, 1)
})

test('repeated controller activations share ownership and restore the fallback', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const fallback = source(120),
		controller = source(300)
	const removeFallback = registry.install(fallback.observe, 'fallback')
	const window = {},
		values = []
	const off = registry.subscribe(window, (value) => values.push(value))
	const first = registry.install(controller.observe)
	const second = registry.install(controller.observe)
	assert.equal(controller.attached.length, 1)
	assert.equal(fallback.attached[0].stopped, 1)
	fallback.attached[0].publish(999)
	assert.deepEqual(values, [120, 300])
	first()
	first()
	assert.equal(controller.attached[0].stopped, 0)
	second()
	assert.equal(controller.attached[0].stopped, 1)
	assert.equal(fallback.attached.length, 2)
	assert.equal(values.at(-1), 120)
	controller.attached[0].publish(999)
	assert.equal(values.at(-1), 120)
	off()
	removeFallback()
	assert.equal(fallback.attached[1].stopped, 1)
})

test('installing or releasing a source with no readers does not attach native resources', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const native = source(250)
	const remove = registry.install(native.observe)
	assert.equal(registry.getSnapshot({}), 0)
	remove()
	assert.equal(native.attached.length, 0)
})

test('inactive object snapshots stay stable for external-store readers without retaining active windows', () => {
	const registry = createKeyboardWindowRegistry(() => ({ inset: 0 }))
	const window = {},
		other = {}
	const empty = registry.getSnapshot(window)
	assert.equal(registry.getSnapshot(window), empty)
	assert.notEqual(registry.getSnapshot(other), empty)
	const remove = registry.install((_key, publish) => {
		publish({ inset: 300 })
		return () => {}
	})
	const off = registry.subscribe(window, () => {})
	assert.equal(registry.getSnapshot(window).inset, 300)
	off()
	assert.equal(registry.getSnapshot(window), empty)
	remove()
})

test('removing the only source returns remaining readers to unknown initial state', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const native = source(250),
		values = []
	const remove = registry.install(native.observe)
	const off = registry.subscribe({}, (value) => values.push(value))
	remove()
	assert.deepEqual(values, [250, 0])
	native.attached[0].publish(999)
	assert.deepEqual(values, [250, 0])
	off()
})

test('failed activation restores every window and invalidates partially attached callbacks', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const a = {},
		b = {},
		valuesA = [],
		valuesB = []
	const fallback = source((window) => (window === a ? 100 : 200))
	registry.install(fallback.observe, 'fallback')
	const offA = registry.subscribe(a, (value) => valuesA.push(value))
	const offB = registry.subscribe(b, (value) => valuesB.push(value))
	let stale,
		stopped = 0
	assert.throws(
		() =>
			registry.install((window, publish) => {
				if (window === b) {
					throw new Error('Missing native callback bridge')
				}
				stale = publish
				publish(300)
				return () => stopped++
			}),
		/activation failed/,
	)
	assert.equal(stopped, 1)
	assert.equal(registry.getSnapshot(a), 100)
	assert.equal(registry.getSnapshot(b), 200)
	stale(999)
	assert.equal(valuesA.at(-1), 100)
	assert.equal(valuesB.at(-1), 200)
	offA()
	offB()
	assert.ok(fallback.attached.every((entry) => entry.stopped === 1))
})

test('one throwing reader does not prevent other readers receiving current state', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const native = source(),
		values = [],
		window = {}
	registry.install(native.observe)
	const offThrowing = registry.subscribe(window, (value) => {
		if (value > 0) {
			throw new Error('Broken subscriber')
		}
	})
	const offHealthy = registry.subscribe(window, (value) => values.push(value))
	assert.throws(() => native.attached[0].publish(200), /subscriber failed/)
	assert.deepEqual(values, [0, 200])
	offThrowing()
	native.attached[0].publish(300)
	assert.deepEqual(values, [0, 200, 300])
	offHealthy()
	assert.equal(native.attached[0].stopped, 1)
})

test('a failing initial reader releases its already-attached source', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const native = source(200),
		window = {}
	registry.install(native.observe)
	assert.throws(
		() =>
			registry.subscribe(window, () => {
				throw new Error('Failed mount')
			}),
		/subscriber failed/,
	)
	assert.equal(native.attached[0].stopped, 1)
	assert.equal(registry.getSnapshot(window), 0)
})

test('unmount during source replacement releases the new observer and rejects its delayed frames', () => {
	const registry = createKeyboardWindowRegistry(() => 0)
	const fallback = source(),
		next = source(250),
		window = {},
		values = []
	registry.install(fallback.observe, 'fallback')
	const off = registry.subscribe(window, (value) => {
		values.push(value)
		if (value > 0) {
			off()
		}
	})
	const remove = registry.install(next.observe)
	assert.equal(fallback.attached[0].stopped, 1)
	assert.equal(next.attached[0].stopped, 1)
	next.attached[0].publish(500)
	assert.deepEqual(values, [0, 250])
	assert.equal(registry.getSnapshot(window), 0)
	remove()
})
