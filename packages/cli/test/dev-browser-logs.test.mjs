import assert from 'node:assert/strict'
import vm from 'node:vm'
import { test } from 'node:test'
import { browserLogScript } from '../dist/dev-log-client.web.js'

test('browser hooks preserve console/error behavior, omit objects, and authenticate delivery', async () => {
	const calls = []
	const delivered = []
	const listeners = new Map()
	const context = vm.createContext({
		Error,
		console: { warn: (...values) => calls.push(values), error: (...values) => calls.push(values) },
		addEventListener: (name, handler) => listeners.set(name, handler),
		fetch: async (url, init) => {
			delivered.push({ url, ...init })
			return { ok: true }
		},
		setTimeout,
	})
	const script = browserLogScript('test-token', '/__xplat_dev__/logs')
	vm.runInContext(script, context)
	vm.runInContext(script, context) // repeated installation must not wrap twice
	vm.runInContext("console.warn('before attach', { privateValue: 'never serialize' })", context)
	vm.runInContext("console.error('x'.repeat(8000))", context)
	let prevented = false
	listeners.get('error')({
		error: new Error('uncaught fixture'),
		preventDefault: () => (prevented = true),
	})
	listeners.get('unhandledrejection')({
		reason: 'rejected fixture',
		preventDefault: () => (prevented = true),
	})
	const unusualError = new Error('unusual fixture')
	unusualError.stack = 17
	assert.doesNotThrow(() => listeners.get('error')({ error: unusualError }))
	// The first request settles before the queue drains; flush uses a bounded
	// retry timer. Let it deliver pending records without a browser engine.
	await new Promise((resolve) => setTimeout(resolve, 1100))
	assert.equal(calls.length, 2)
	assert.equal(calls[1][0].length, 8000)
	assert.equal(prevented, false)
	assert.ok(delivered.every((r) => r.headers['x-xplat-dev-token'] === 'test-token'))
	const records = delivered.flatMap((r) => JSON.parse(r.body).records)
	assert.equal(records.filter((r) => r.line.includes('before attach')).length, 1)
	assert.ok(records.some((r) => r.line.includes('[object omitted]')))
	assert.ok(records.some((r) => r.line.includes('uncaught fixture')))
	assert.ok(records.some((r) => r.line.includes('rejected fixture')))
	assert.ok(!JSON.stringify(delivered).includes('never serialize'))
	assert.ok(records.every((r) => r.line.length <= 2048))
	assert.ok(records.some((r) => r.line.endsWith('[truncated]')))
})
