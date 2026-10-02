import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { notifications } from '../src/notifications.macos.ts'
import { permissions } from '../../platform/src/permissions.ts'

const globals = globalThis as any
afterEach(() => {
	delete globals.XplatLocalNotifications
})

test('missing native metadata is unsupported and registers its permission owner', async () => {
	assert.equal(notifications.supported, false)
	assert.equal(notifications.impl, null)
	assert.equal(await notifications.ensure(), 'unsupported')
	assert.equal(await permissions.ensure('notifications'), 'unsupported')
})

test('permission callbacks preserve granted and denied results via both entry points', async () => {
	for (const result of ['granted', 'denied']) {
		globals.XplatLocalNotifications = {
			isAvailable: () => true,
			ensure: (done: any) => queueMicrotask(() => done(result)),
		}

		assert.equal(notifications.supported, true)
		assert.equal(await notifications.ensure(), result)
		assert.equal(await permissions.ensure('notifications'), result)
	}
})

test('notify forwards optional body without requesting permission or colliding in JS', () => {
	const calls: unknown[] = []
	globals.XplatLocalNotifications = {
		isAvailable: () => true,
		ensure: () => {
			throw new Error('notify must not prompt')
		},
		notifyBody: (...args: unknown[]) => calls.push(args),
	}

	const impl = notifications.impl!
	assert.equal(impl.notify('one'), undefined)
	impl.notify('two', 'body')
	assert.deepEqual(calls, [
		['one', ''],
		['two', 'body'],
	])

	delete globals.XplatLocalNotifications
	assert.doesNotThrow(() => impl.notify('unloaded'))
})

test('native permission invocation errors reject instead of hanging', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => true,
		ensure: () => {
			throw new Error('native failure')
		},
	}

	await assert.rejects(notifications.ensure(), /native failure/)
})

test('an unbundled host with metadata remains unsupported without touching the OS center', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => false,
		ensure: () => {
			throw new Error('must not call center without bundle identity')
		},
	}

	assert.equal(notifications.supported, false)
	assert.equal(notifications.impl, null)
	assert.equal(await notifications.ensure(), 'unsupported')
})
