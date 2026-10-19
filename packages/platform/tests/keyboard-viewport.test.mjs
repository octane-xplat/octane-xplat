import assert from 'node:assert/strict'
import test from 'node:test'
import {
	installKeyboardViewportAdapter,
	observeKeyboardViewport,
} from '../src/keyboard-viewport.ts'

test('viewport ownership follows adapter activation and final release', () => {
	let acquisitions = 0,
		releases = 0,
		updates = 0
	const adapter = () => {
		acquisitions++
		return {
			supported: true,
			update() {
				updates++
			},
			release() {
				releases++
			},
		}
	}
	const lease = observeKeyboardViewport({})
	assert.equal(lease.supported, false)
	const first = installKeyboardViewportAdapter(adapter)
	const second = installKeyboardViewportAdapter(adapter)
	assert.equal(acquisitions, 1)
	lease.update()
	assert.equal(updates, 1)
	first()
	assert.equal(releases, 0)
	second()
	assert.equal(releases, 1)
	assert.equal(lease.supported, false)
	lease.release()
	lease.release()
	const unused = installKeyboardViewportAdapter(adapter)
	assert.equal(acquisitions, 1)
	unused()
})

test('adapter attachment failure rolls existing consumers back to their prior policy', () => {
	let acquired = 0,
		released = 0
	const good = installKeyboardViewportAdapter(() => {
		acquired++
		return {
			supported: true,
			update() {},
			release() {
				released++
			},
		}
	})
	const lease = observeKeyboardViewport({})
	assert.throws(
		() =>
			installKeyboardViewportAdapter(() => {
				throw new Error('failed')
			}),
		AggregateError,
	)
	assert.equal(lease.supported, true)
	assert.equal(acquired, 2)
	assert.equal(released, 1)
	lease.release()
	good()
	assert.equal(released, 2)
})

test('detachment releases native policy and reattachment acquires the current host owner', () => {
	const events = new Map()
	const host = {
		isLoaded: false,
		owner: 1,
		on: (name, read) => events.set(name, read),
		off: (name) => events.delete(name),
	}
	const acquisitions = [],
		releases = []
	const stop = installKeyboardViewportAdapter((view) => {
		const owner = view.owner
		acquisitions.push(owner)
		return {
			supported: true,
			update() {},
			release() {
				releases.push(owner)
			},
		}
	})
	const lease = observeKeyboardViewport(host)
	assert.deepEqual(acquisitions, [])
	host.isLoaded = true
	events.get('loaded')()
	assert.deepEqual(acquisitions, [1])
	host.isLoaded = false
	events.get('unloaded')()
	assert.deepEqual(releases, [1])
	assert.equal(lease.supported, false)
	host.owner = 2
	host.isLoaded = true
	events.get('loaded')()
	assert.deepEqual(acquisitions, [1, 2])
	lease.release()
	stop()
	assert.deepEqual(releases, [1, 2])
	assert.equal(events.size, 0)
})

test('out-of-order release retains the newest repeated adapter activation', () => {
	let current
	const adapter = (name) => () => {
		current = name
		return { supported: true, update() {}, release() {} }
	}
	const a = adapter('a'),
		b = adapter('b')
	const first = installKeyboardViewportAdapter(a)
	const lease = observeKeyboardViewport({})
	const middle = installKeyboardViewportAdapter(b)
	const last = installKeyboardViewportAdapter(a)
	first()
	assert.equal(current, 'a')
	last()
	assert.equal(current, 'b')
	middle()
	lease.release()
})
