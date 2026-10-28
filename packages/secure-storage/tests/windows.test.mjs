import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/secure-storage.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

class UnavailabilityError extends Error {
	name = 'UnavailabilityError'
}

function fixture() {
	const entries = new Map()
	const state = { family: 'app.one', fail: false, malformed: false, calls: 0 }
	const missing = () => new Error('Elemento no encontrado. (HRESULT 0x80070490)')
	class PasswordCredential {
		constructor(resource, userName, password) {
			this.Resource = resource
			this.UserName = userName
			this.Password = password
		}
		RetrievePassword() {}
	}
	class PasswordVault {
		constructor() {
			state.calls++
			if (state.fail) {
				throw new Error('private native exception')
			}
		}
		Retrieve(resource, userName) {
			const entry = entries.get(JSON.stringify([resource, userName]))
			if (!entry) {
				throw missing()
			}
			return state.malformed ? new PasswordCredential(resource, userName, '123') : entry
		}
		Add(credential) {
			assert.ok(credential.UserName.length > 0)
			assert.ok(credential.Password.length > 0)
			entries.set(JSON.stringify([credential.Resource, credential.UserName]), credential)
		}
		Remove(credential) {
			entries.delete(JSON.stringify([credential.Resource, credential.UserName]))
		}
	}
	const Windows = {
		Security: { Credentials: { PasswordVault, PasswordCredential } },
		ApplicationModel: {
			Package: {
				get Current() {
					if (state.family === null) {
						throw new Error('No package identity')
					}
					return { Id: { FamilyName: state.family } }
				},
			},
		},
	}
	const load = (windows = Windows) => {
		const exports = {}
		vm.runInNewContext(source, {
			exports,
			require(id) {
				if (id === '@octane-xplat/lib/capability') {
					return { UnavailabilityError }
				}
				assert.equal(id, '@octane-xplat/platform/windows', 'must not import a mobile plugin')
				return { Windows: windows }
			},
		})
		return exports.secureStorage
	}
	return { state, entries, Windows, load }
}

test('Windows root condition resolves the dedicated entry without loading mobile code', () => {
	const result = spawnSync(
		process.execPath,
		[
			'--conditions=windows',
			'--input-type=module',
			'-e',
			"process.stdout.write(import.meta.resolve('@octane-xplat/secure-storage'))",
		],
		{ cwd: new URL('..', import.meta.url), encoding: 'utf8' },
	)
	assert.equal(result.status, 0, result.stderr)
	assert.ok(result.stdout.endsWith('/src/index.windows.ts'))
})

test('Windows credential storage is unavailable without package identity or projected APIs', async () => {
	const { state, load } = fixture()
	for (const store of [load(null), load({})]) {
		assert.equal(store.supported, false)
		assert.equal(await store.isAvailable(), false)
		await assert.rejects(store.get('entry'), UnavailabilityError)
		await assert.rejects(store.set('entry', 'value'), UnavailabilityError)
		await assert.rejects(store.remove('entry'), UnavailabilityError)
	}
	state.family = null
	const store = load()
	assert.equal(store.supported, false)
	await assert.rejects(store.get('entry'), UnavailabilityError)
	assert.equal(state.calls, 0)
})

test('Windows credential storage preserves strings, overwrites and distinguishes missing keys', async () => {
	const { load } = fixture()
	const store = load()
	assert.equal(store.supported, true)
	assert.equal(await store.isAvailable(), true)
	assert.equal(await store.get('entry'), null)
	for (const value of ['first', '', 'Ω\u0000\r\nnext']) {
		assert.equal(await store.set('', value), true)
		assert.ok((await store.get('')) === value, 'private roundtrip failed')
	}
	assert.equal(await store.remove(''), true)
	assert.equal(await store.remove(''), true)
	assert.equal(await store.get(''), null)
})

test('Windows package namespaces separate equal keys and remove only the selected entry', async () => {
	const { load, state, entries } = fixture()
	const store = load()
	await store.set('entry', 'one')
	state.family = 'app.two'
	assert.equal(await store.get('entry'), null)
	await store.set('entry', 'two')
	await store.remove('entry')
	assert.equal(entries.size, 1)
	state.family = 'app.one'
	assert.ok((await store.get('entry')) === 'one')
})

test('Windows vault failures are sanitized and malformed values do not masquerade as missing', async () => {
	const { load, state } = fixture()
	const store = load()
	await store.set('entry', 'private value')
	state.malformed = true
	await assert.rejects(store.get('entry'), { message: 'Credential Locker read failed' })
	state.fail = true
	assert.equal(store.supported, true)
	assert.equal(await store.isAvailable(), false)
	await assert.rejects(store.get('entry'), { message: 'Credential Locker read failed' })
	assert.equal(await store.set('entry', 'private value'), false)
	assert.equal(await store.remove('entry'), false)
})
