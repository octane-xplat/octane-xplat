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
	assert.equal(await notifications.isAvailable(), false)
	assert.deepEqual(await notifications.requestPermissions(), {
		status: 'unsupported',
		granted: false,
		canAskAgain: false,
	})
	assert.deepEqual(await permissions.requestPermissions('notifications'), {
		status: 'unsupported',
		granted: false,
		canAskAgain: false,
	})
	assert.throws(() => notifications.notify('title'), { name: 'UnavailabilityError' })
})

test('permission callbacks preserve granted and denied results via both entry points', async () => {
	for (const result of ['granted', 'denied']) {
		globals.XplatLocalNotifications = {
			isAvailable: () => true,
			ensure: (done: any) => queueMicrotask(() => done(result)),
		}

		assert.equal(notifications.supported, true)
		const direct = await notifications.requestPermissions()
		assert.equal(direct.status, result)
		const owned = await permissions.requestPermissions('notifications')
		assert.equal(owned.status, result)
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

	assert.equal(notifications.notify('one'), undefined)
	notifications.notify('two', 'body')
	assert.deepEqual(calls, [
		['one', ''],
		['two', 'body'],
	])

	delete globals.XplatLocalNotifications
	assert.throws(() => notifications.notify('unloaded'), { name: 'UnavailabilityError' })
})

test('native permission invocation errors reject instead of hanging', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => true,
		ensure: () => {
			throw new Error('native failure')
		},
	}

	await assert.rejects(notifications.requestPermissions(), /native failure/)
})

test('an unbundled host with metadata remains unsupported without touching the OS center', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => false,
		ensure: () => {
			throw new Error('must not call center without bundle identity')
		},
	}

	assert.equal(notifications.supported, false)
	assert.equal(await notifications.isAvailable(), false)
	assert.equal((await notifications.requestPermissions()).status, 'unsupported')
})
