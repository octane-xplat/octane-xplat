import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { notificationBody } from '../src/notification-body.ts'
import { notificationBody as iosBody } from '../src/notification-body.ios.ts'

// Exercise the actual leaves with injected plugin/host boundaries, without an OS runtime.
function loadLeaf(name: string, globals: Record<string, unknown>) {
	const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
		.replace(/^import .*$/gm, '')
		.replace('export const notifications', 'const notifications')

	return runInNewContext(stripTypeScriptTypes(source) + '\nnotifications', globals)
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

test('mobile notify checks permission without prompting and drops denied sends', async () => {
	for (const granted of [false, true]) {
		const calls: unknown[] = []
		const leaf = loadLeaf('notifications', {
			notificationBody,
			LocalNotifications: {
				hasPermission: async () => granted,
				requestPermission: () => {
					throw Error('notify must not prompt')
				},
				schedule: async (options: unknown) => calls.push(options),
			},
		})

		assert.equal(leaf.impl.notify('title', 'body'), undefined)
		await flush()
		assert.equal(calls.length, granted ? 1 : 0)
	}
})

test('mobile notify consumes permission and schedule failures', async () => {
	for (const failing of ['hasPermission', 'schedule']) {
		const leaf = loadLeaf('notifications', {
			notificationBody,
			LocalNotifications: {
				hasPermission: async () => {
					if (failing === 'hasPermission') {
						throw Error('permission failure')
					}

					return true
				},
				schedule: async () => {
					throw Error('schedule failure')
				},
			},
		})

		assert.doesNotThrow(() => leaf.impl.notify('title'))
		await flush() // Node's test runner fails on unhandled promise rejections.
	}
})

test('mobile IDs stay distinct with a frozen clock and wrap within signed int range', async () => {
	const entries: any[] = []
	const leaf = loadLeaf('notifications', {
		Date: { now: () => 2147483646 },
		notificationBody,
		LocalNotifications: {
			hasPermission: async () => true,
			schedule: async (options: any[]) => entries.push(...options),
		},
	})

	for (let i = 0; i < 3; i++) {
		leaf.impl.notify(`title ${i}`)
	}

	await flush()
	assert.deepEqual(
		entries.map((entry) => entry.id),
		[2147483646, 0, 1],
	)

	assert.equal(entries[0].body, '')
})

test('iOS preserves title for missing/empty bodies under plugin 7.0.0 normalization', () => {
	// Pinned index.ios.js content mapping: title = body || subtitle ? title : undefined;
	// body = body || subtitle || title || ' '. No subtitle is sent by this leaf.
	for (const input of [undefined, '', 'message']) {
		const body = iosBody(input)
		const title: string = 'title'
		const content = { title: body ? title : undefined, body: body || title || ' ' }
		assert.equal(content.title, 'title')
		assert.equal(content.body, input || ' ')
	}

	assert.equal(notificationBody(''), '')
})

test('web absence is unsupported and notify is a safe no-op', async () => {
	const leaf = loadLeaf('notifications.web', { desktopHost: () => null })
	assert.equal(leaf.supported, false)
	assert.equal(await leaf.ensure(), 'unsupported')
	assert.doesNotThrow(() => leaf.impl.notify('title'))
})

test('web forwards granted notifications and preserves desktop host delivery', async () => {
	const calls: unknown[] = []
	class Notification {
		static permission = 'granted'
		constructor(title: string, options: unknown) {
			calls.push([title, options])
		}
	}

	const leaf = loadLeaf('notifications.web', { desktopHost: () => null, Notification })
	leaf.impl.notify('title', 'body')
	assert.equal(calls.length, 1)
	Notification.permission = 'denied'
	leaf.impl.notify('blocked')
	assert.equal(calls.length, 1)
	const hostLeaf = loadLeaf('notifications.web', {
		desktopHost: () => ({ notifications: { notify: async (title: string) => calls.push(title) } }),
	})

	hostLeaf.impl.notify('host')
	await flush()
	assert.equal(calls[1], 'host')
})
