import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/secure-storage.macos.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText

function load(bridge) {
	const exports = {}
	runInNewContext(compiled, { exports, XplatSecureStorage: bridge })
	return exports.secureStorage
}

test('absence is unsupported', async () => {
	const capability = load(undefined)
	assert.equal(capability.supported, false)
	assert.equal(await capability.ensure(), 'unsupported')
	assert.equal(capability.impl, null)
})

test('async contract forwards values privately and distinguishes read failures', async () => {
	const payload = randomUUID()
	const values = new Map()
	const capability = load({
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

	assert.equal(capability.supported, true)
	assert.equal(await capability.ensure(), 'granted')
	const store = capability.impl
	assert.equal(await store.get('entry'), null)
	assert.equal(await store.set('entry', payload), true)
	assert.ok((await store.get('entry')) === payload, 'private roundtrip failed')
	assert.equal(await store.set('entry', ''), true)
	assert.ok((await store.get('entry')) === '', 'empty value failed')
	assert.equal(await store.remove('entry'), true)
	assert.equal(await store.remove('entry'), true)
	assert.equal(await store.get('entry'), null)
	for (const status of [-25293, -25308, -26275]) {
		await assert.rejects(load({ get: () => ({ objectForKey: () => status }) }).impl.get('entry'), {
			message: 'Keychain read failed',
		})
	}
})

test('bridge failures never forward native exception contents', async () => {
	const payload = randomUUID()
	const fail = () => {
		throw new Error(payload)
	}

	const store = load({ get: fail, set: fail, remove: fail }).impl
	await assert.rejects(store.get('entry'), { message: 'Keychain read failed' })
	assert.equal(await store.set('entry', payload), false)
	assert.equal(await store.remove('entry'), false)
	assert.equal(await load({ set: () => false }).impl.set('entry', payload), false)
	assert.equal(await load({ remove: () => false }).impl.remove('entry'), false)
})
