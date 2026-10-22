import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dispatchPress } from './probe/press.ts'

test('press dispatch preserves core gesture context and Mason click listeners', () => {
	const context = {}
	let received
	const core = {
		isLoaded: true,
		getGestureObservers: () => [
			{
				context,
				callback(event) {
					received = { context: this, event }
				},
			},
		],
		notify() {
			assert.fail('core gesture must dispatch only once')
		},
	}
	dispatchPress(core)
	assert.equal(received.context, context)
	assert.deepEqual(received.event, { eventName: 'tap', object: core })
	const mason = {
		isLoaded: true,
		hasListeners: (name) => name === 'click',
		notify(event) {
			received = event
		},
	}
	dispatchPress(mason)
	assert.deepEqual(received, { eventName: 'click', object: mason })
})

test('unloaded and handler-free views cannot be pressed', () => {
	for (const view of [
		{ isLoaded: false, hasListeners: () => true, notify: () => assert.fail('unloaded dispatch') },
		{ isLoaded: true, hasListeners: () => false },
	]) {
		assert.throws(() => dispatchPress(view), /no loaded press handler/)
	}
})
