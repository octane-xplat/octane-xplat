import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const requireLib = createRequire(import.meta.url)

const source = readFileSync(new URL('../src/secure-storage.macos.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText

function load(bridge, descriptor) {
	const exports = {}, context = { exports, require: (id) => requireLib(id) }
	Object.defineProperty(context, 'XplatSecureStorage', descriptor ?? { value: bridge })
	runInNewContext(compiled, context)
	return exports.secureStorage
}

function complete(overrides = {}) {
	return { get: () => ({ objectForKey: () => -25300 }), set: () => false, remove: () => false, ...overrides }
}

test('absence is unsupported', async () => {
	const capability = load(undefined)
	assert.equal(capability.supported, false)
	assert.equal(await capability.isAvailable(), false)
	await assert.rejects(capability.get('entry'), { name: 'UnavailabilityError' })
	await assert.rejects(capability.set('entry', 'v'), { name: 'UnavailabilityError' })
	await assert.rejects(capability.remove('entry'), { name: 'UnavailabilityError' })
})

test('async contract forwards values privately and distinguishes read failures', async () => {
	const payload = randomUUID()
	const values = new Map()
	const store = load({
		get: (key) => ({
			objectForKey: (field) =>
				field === 'status' ? (values.has(key) ? 0 : -25300) : values.get(key),
		}),
		set: ({ key, value }) => {
			values.set(key, value)
			return true
		},
		remove: (key) => {
			values.delete(key)
			return true
		},
	})

	assert.equal(store.supported, true)
	assert.equal(await store.isAvailable(), true)
	assert.equal(await store.get('entry'), null)
	assert.equal(await store.set('entry', payload), true)
	assert.ok((await store.get('entry')) === payload, 'private roundtrip failed')
	assert.equal(await store.set('entry', ''), true)
	assert.ok((await store.get('entry')) === '', 'empty value failed')
	assert.equal(await store.remove('entry'), true)
	assert.equal(await store.remove('entry'), true)
	assert.equal(await store.get('entry'), null)
	for (const status of [-25293, -25308, -26275]) {
		await assert.rejects(load(complete({ get: () => ({ objectForKey: () => status }) })).get('entry'), {
			message: 'Keychain read failed',
		})
	}
})

test('bridge failures never forward native exception contents', async () => {
	const payload = randomUUID()
	const fail = () => {
		throw new Error(payload)
	}

	const store = load({ get: fail, set: fail, remove: fail })
	await assert.rejects(store.get('entry'), { message: 'Keychain read failed' })
	assert.equal(await store.set('entry', payload), false)
	assert.equal(await store.remove('entry'), false)
	assert.equal(await load(complete({ set: () => false })).set('entry', payload), false)
	assert.equal(await load(complete({ remove: () => false })).remove('entry'), false)
})

// Authored source/VM models only; these are not native Keychain evidence.
test('partial bridges are unsupported and operations reject without dispatch', async () => {
	let calls = 0
	for (const bridge of [{}, { get() { calls++; return null } }, complete({ remove: undefined })]) {
		const store = load(bridge)
		assert.equal(store.supported, false); assert.equal(await store.isAvailable(), false)
		await assert.rejects(store.get('entry'), { name: 'UnavailabilityError' })
		await assert.rejects(store.set('entry', ''), { name: 'UnavailabilityError' })
		await assert.rejects(store.remove('entry'), { name: 'UnavailabilityError' })
	}
	assert.equal(calls, 0)
})

test('binding and method lookup failures are contained without forwarding payloads', async () => {
	const payload = randomUUID(), fail = () => { throw Error(payload) }
	for (const store of [load(undefined, { get: fail }), load(Object.defineProperty(complete(), 'set', { get: fail }))]) {
		assert.equal(store.supported, false); assert.equal(await store.isAvailable(), false)
		for (const invoke of [() => store.get('entry'), () => store.set('entry', payload), () => store.remove('entry')]) {
			let pending
			assert.doesNotThrow(() => { pending = invoke() })
			await assert.rejects(pending, error => error.name === 'UnavailabilityError' && !error.message.includes(payload))
		}
	}
})

test('each operation captures one binding and method set with their native receiver', async () => {
	for (const action of ['get', 'set', 'remove']) {
		let bindings = 0, getReads = 0, setReads = 0, removeReads = 0, calls = 0
		const bridge = {
			get get() { getReads++; return function(key) { assert.equal(this, bridge); assert.equal(key, 'entry'); calls++; return { objectForKey: field => field === 'status' ? 0 : '' } } },
			get set() { setReads++; return function(options) { assert.equal(this, bridge); assert.equal(options.key, 'entry'); assert.equal(options.value, ''); calls++; return true } },
			get remove() { removeReads++; return function(key) { assert.equal(this, bridge); assert.equal(key, 'entry'); calls++; return true } },
		}
		const store = load(undefined, { get() { bindings++; return bindings === 1 ? bridge : null } })
		const result = action === 'set' ? await store.set('entry', '') : await store[action]('entry')
		assert.equal(result, action === 'get' ? '' : true)
		assert.deepEqual([bindings, getReads, setReads, removeReads, calls], [1, 1, 1, 1, 1])
	}
})

test('missing and malformed native read responses are failures, not missing entries', async () => {
	const fail = () => { throw Error(randomUUID()) }
	const responses = [null, undefined, {}, { objectForKey: true }, { objectForKey: () => undefined },
		{ objectForKey: field => field === 'status' ? 0 : 7 }, { objectForKey: () => '0' },
		Object.defineProperty({}, 'objectForKey', { get: fail }), { objectForKey: fail },
		{ objectForKey: field => field === 'status' ? 0 : fail() }]
	for (const response of responses) {
		await assert.rejects(load(complete({ get: () => response })).get('entry'), { message: 'Keychain read failed' })
	}
})

test('dictionary reading captures its receiver, reads status once and skips failed values', async () => {
	for (const status of [0, -25300, -25308]) {
		let reads = 0, statusReads = 0, valueReads = 0
		const response = { get objectForKey() {
			reads++
			return function(field) {
				assert.equal(this, response)
				if (field === 'status') { statusReads++; return status }
				valueReads++; assert.equal(status, 0); return ''
			}
		} }
		const store = load(complete({ get: () => response }))
		if (status === 0) {assert.equal(await store.get('entry'), '')}
		else if (status === -25300) {assert.equal(await store.get('entry'), null)}
		else {await assert.rejects(store.get('entry'), { message: 'Keychain read failed' })}
		assert.deepEqual([reads, statusReads, valueReads], [1, 1, status === 0 ? 1 : 0])
	}
})

test('nonboolean write and removal responses cannot report success', async () => {
	for (const result of [undefined, null, 0, 1, '', 'YES', {}]) {
		const store = load(complete({ set: () => result, remove: () => result }))
		assert.equal(await store.set('entry', ''), false)
		assert.equal(await store.remove('entry'), false)
	}
})
