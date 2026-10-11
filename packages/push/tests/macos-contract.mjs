import assert from 'node:assert/strict'

// Shared assertions for the source leaf and isolated packed consumers.
export async function assertMacOSPush(push) {
	assert.equal(push.supported, false)
	assert.equal(push.configured, false)
	assert.equal(await push.getToken(), null)
	let events = 0
	const handler = () => events++
	const subscribe = () => [
		push.onMessage(handler),
		push.onNotificationOpen(handler),
		push.onTokenRefresh(handler),
	]

	const before = subscribe()
	const options = new Proxy(
		{},
		{
			get() {
				throw new Error('unsupported backend must not inspect provider options')
			},
		},
	)

	for (let attempt = 0; attempt < 2; attempt++) {
		await assert.rejects(push.configure(options), /remote push is not supported on macOS/)
		await assert.rejects(push.requestPermission(), /remote push is not supported on macOS/)
		assert.equal(push.configured, false)
		assert.equal(await push.getToken(), null)
		await push.deleteToken()
	}

	const after = subscribe()
	await Promise.resolve()
	for (const unsubscribe of [...before, ...after]) {
		assert.equal(typeof unsubscribe, 'function')
		unsubscribe()
		unsubscribe()
	}

	await Promise.resolve()
	assert.equal(events, 0, 'inert subscriptions never fabricate events')
	assert.equal(push.supported, false)
	assert.equal(push.configured, false)
}
