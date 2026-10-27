import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpile(
	await readFile(new URL('../src/biometrics.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)

// Stub the plugin + @nativescript/core so the shared NativeScript leaf can be
// exercised without a device — captures the last availability result, verify
// options, and lets tests fail or gate the plugin calls.
function load({
	ios = false,
	available = { any: true, biometrics: true },
	verifyResult = { code: 0 },
} = {}) {
	const calls = []
	let gate = null
	class StubBiometricAuth {
		available() {
			return available instanceof Error ? Promise.reject(available) : Promise.resolve(available)
		}

		verifyBiometric(options) {
			calls.push(options)
			return new Promise((resolve, reject) => {
				gate = { resolve, reject, verifyResult }
			})
		}
	}

	const context = {
		exports: {},
		require: (id) => {
			if (id === '@nativescript/biometrics') {
				return { BiometricAuth: StubBiometricAuth }
			}

			if (id === '@nativescript/core') {
				return { isIOS: ios }
			}

			return {}
		},
	}

	vm.runInNewContext(source, context)
	return {
		api: context.exports.biometrics,
		calls,
		release: (result) => {
			const g = gate
			gate = null
			if (result instanceof Error) {
				g.reject(result)
			} else {
				g.resolve(result ?? g.verifyResult)
			}
		},
	}
}

test('ensure resolves unsupported instead of rejecting on plugin absence errors', async () => {
	const h = load({ available: new Error('no hardware') })
	assert.equal((await h.api.requestPermissions()).status, 'unsupported')
})

test('ensure reports secure-lockscreen-without-biometrics as unsupported on Android', async () => {
	const h = load({ available: { any: true, biometrics: false } })
	assert.equal((await h.api.requestPermissions()).status, 'unsupported')
})

test('ensure grants usable biometrics on both leaves', async () => {
	assert.equal((await load({ ios: false }).api.requestPermissions()).status, 'granted')
	assert.equal((await load({ ios: true, available: { any: true } }).api.requestPermissions()).status, 'granted')
	assert.equal((await load({ available: { any: false } }).api.requestPermissions()).status, 'unsupported')
})

test('verify surfaces the reason through the iOS LAContext path', async () => {
	const h = load({ ios: true })
	const pending = h.api.verify('Unlock vault')
	assert.equal(h.calls.length, 1)
	// Options cross the vm realm — compare fields, not prototypes.
	assert.equal(JSON.parse(JSON.stringify(h.calls[0])).title, 'Unlock vault')
	assert.equal(h.calls[0].message, 'Unlock vault')
	assert.equal(h.calls[0].pinFallback, true)
	assert.equal(h.calls[0].ios.customFallback, true)
	h.release()
	assert.equal(await pending, true)
})

test('verify keeps the Android dialog title path unchanged', async () => {
	const h = load({ ios: false })
	const pending = h.api.verify('Unlock vault')
	assert.equal(h.calls[0].title, 'Unlock vault')
	assert.equal(h.calls[0].pinFallback, undefined)
	h.release({ code: 0 })
	assert.equal(await pending, true)
})

test('a second overlapping verify resolves false without a new prompt', async () => {
	const h = load()
	const first = h.api.verify('one')
	const second = await h.api.verify('two')
	assert.equal(second, false)
	assert.equal(h.calls.length, 1)
	h.release({ code: 0 })
	assert.equal(await first, true)
	// After settlement a fresh verify prompts again.
	const third = h.api.verify('three')
	assert.equal(h.calls.length, 2)
	h.release({ code: 1 })
	assert.equal(await third, false)
})

test('verify resolves false when the plugin rejects', async () => {
	const h = load()
	const pending = h.api.verify('unlock')
	h.release(new Error('user cancelled'))
	assert.equal(await pending, false)
})
