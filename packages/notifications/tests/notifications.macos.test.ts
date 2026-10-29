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

test('read and request callbacks preserve all permission states through both entry points', async () => {
	for (const result of ['granted', 'denied', 'undetermined', 'unsupported']) {
		globals.XplatLocalNotifications = {
			isAvailable: () => true,
			getStatus: (done: any) => queueMicrotask(() => done(result)),
			notifyBody() {},
			ensure: (done: any) => queueMicrotask(() => done(result)),
		}

		assert.equal(notifications.supported, true)
		const direct = await notifications.requestPermissions()
		assert.equal(direct.status, result)
		const read = await permissions.getPermissions('notifications')
		assert.equal(read.status, result)
		assert.equal(read.canAskAgain, result === 'granted' || result === 'undetermined')
		const owned = await permissions.requestPermissions('notifications')
		assert.equal(owned.status, result)
	}
})

test('notify forwards optional body without requesting permission or colliding in JS', () => {
	const calls: unknown[] = []
	globals.XplatLocalNotifications = {
		isAvailable: () => true,
		getStatus: () => { throw new Error('notify must not query in JS') },
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
		getStatus: () => { throw new Error('read failure') },
		notifyBody() {},
		ensure: () => {
			throw new Error('native failure')
		},
	}

	await assert.rejects(notifications.requestPermissions(), /native failure/)
	await assert.rejects(notifications.getPermissions(), /read failure/)
})

test('an unbundled host with metadata remains unsupported without touching the OS center', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => false,
		getStatus: () => { throw new Error('unbundled query must not touch center') },
		notifyBody() {},
		ensure: () => {
			throw new Error('must not call center without bundle identity')
		},
	}

	assert.equal(notifications.supported, false)
	assert.equal(await notifications.isAvailable(), false)
	assert.equal((await notifications.requestPermissions()).status, 'unsupported')
})


test('permission reads never invoke authorization, including the shared dispatcher', async () => {
	let reads = 0, prompts = 0
	globals.XplatLocalNotifications = {
		isAvailable: () => 1,
		getStatus: (done: (status: string) => void) => { reads++; done('undetermined') },
		ensure: (done: (status: string) => void) => { prompts++; done('granted') }, notifyBody() {},
	}
	assert.equal((await notifications.getPermissions()).status, 'undetermined')
	assert.equal((await permissions.getPermissions('notifications')).canAskAgain, true)
	assert.equal(prompts, 0); assert.equal(reads, 2)
	assert.equal((await notifications.requestPermissions()).granted, true); assert.equal(prompts, 1)
})
test('stale/malformed bridges and availability failures are unsupported without a legacy prompt fallback', async () => {
	for (const bridge of [
		{ isAvailable: () => true, ensure() { throw Error('legacy prompt') }, notifyBody() {} },
		{ isAvailable() { throw Error('availability failed') }, getStatus() {}, ensure() {}, notifyBody() {} },
	]) {
		globals.XplatLocalNotifications = bridge
		assert.equal(notifications.supported, false)
		assert.equal((await notifications.getPermissions()).status, 'unsupported')
		assert.equal((await notifications.requestPermissions()).status, 'unsupported')
	}
})
test('unknown callback states normalize to unsupported and duplicate callbacks settle only once', async () => {
	globals.XplatLocalNotifications = {
		isAvailable: () => true,
		getStatus: (done: (status: string) => void) => { done('future-status'); done('granted') },
		ensure: (done: (status: string) => void) => { done('denied'); done('granted') }, notifyBody() {},
	}
	assert.deepEqual(await notifications.getPermissions(), { status: 'unsupported', granted: false, canAskAgain: false })
	assert.equal((await notifications.requestPermissions()).status, 'denied')
})
