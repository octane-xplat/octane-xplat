import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpile(
	await readFile(new URL('../src/biometrics.macos.ts', import.meta.url), 'utf8'),
	{
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	},
)

function load({ available = true, code, domain = 'com.apple.LocalAuthentication', failure } = {}) {
	const contexts = []
	const exports = {}
	const requireLib = createRequire(import.meta.url)
	const globals = { exports, require: (id) => requireLib(id) }
	if (available) {
		Object.assign(globals, {
			objc: {
				import(name) {
					assert.equal(name, 'LocalAuthentication')
				},
			},
			interop: { Reference: class {} },
			LAContext: {
				new() {
					if (failure === 'construct') {
						throw new Error('construction failed')
					}

					const context = {
						invalidated: false,
						canEvaluatePolicyError(policy, error) {
							assert.equal(policy, 1)
							if (failure === 'check') {
								throw new Error('check failed')
							}

							if (code !== undefined) {
								error.value = { code, domain }
							}

							return code === undefined
						},
						evaluatePolicyLocalizedReasonReply(policy, reason, reply) {
							assert.equal(policy, 1)
							assert.equal(this.localizedFallbackTitle, '')
							if (failure === 'evaluate') {
								throw new Error('evaluation failed')
							}

							this.reason = reason
							this.reply = reply
						},
						invalidate() {
							this.invalidated = true
							if (failure === 'cleanup') {
								throw new Error('cleanup failed')
							}
						},
					}

					contexts.push(context)
					return context
				},
			},
		})
	}

	vm.runInNewContext(source, globals)
	return { biometrics: exports.biometrics, contexts }
}

test('missing host is unsupported with no implementation', async () => {
	const { biometrics } = load({ available: false })
	assert.equal(biometrics.supported, false)
	assert.equal(await biometrics.isAvailable(), false)
	assert.equal((await biometrics.requestPermissions()).status, 'unsupported')
	await assert.rejects(biometrics.verify('Unlock'), { name: 'UnavailabilityError' })
})

test('availability never prompts and uses a fresh, invalidated context', async () => {
	const { biometrics, contexts } = load()
	assert.equal(biometrics.supported, true)
	assert.equal((await biometrics.requestPermissions()).status, 'granted')
	assert.equal((await biometrics.requestPermissions()).status, 'granted')
	assert.equal(contexts.length, 2)
	assert.ok(contexts.every((c) => c.invalidated && !c.reply))
})

for (const [code, expected] of [
	[-6, 'unsupported'],
	[-7, 'unsupported'],
	[-12, 'unsupported'],
	[-13, 'unsupported'],
	[-8, 'denied'],
	[-10, 'denied'],
	[-4, 'denied'],
]) {
	test(`availability error ${code} returns ${expected}`, async () => {
		const { biometrics, contexts } = load({ code })
		assert.equal((await biometrics.requestPermissions()).status, expected)
		assert.equal(await biometrics.verify('Unlock'), false)
		assert.ok(contexts.every((c) => c.invalidated && !c.reply))
	})
}

test('unknown error domain is denied even with a matching numeric code', async () => {
	assert.equal((await load({ code: -6, domain: 'other' }).biometrics.requestPermissions()).status, 'denied')
})

for (const [success, error, expected] of [
	[true, null, true],
	[false, { code: -2 }, false],
	[false, { code: -1 }, false],
	[true, { code: -4 }, false],
]) {
	test(`prompt result ${success}/${error?.code ?? 'none'} resolves ${expected}`, async () => {
		const { biometrics, contexts } = load()
		const pending = biometrics.verify('Unlock saved trips')
		assert.equal(contexts[0].reason, 'Unlock saved trips')
		assert.equal(await biometrics.verify('Other prompt'), false)
		assert.equal(contexts.length, 1)
		const reply = contexts[0].reply
		reply(success, error)
		reply(!success, null)
		assert.equal(await pending, expected)
		assert.equal(contexts[0].invalidated, true)
		const next = biometrics.verify('Again')
		contexts[1].reply(true, null)
		assert.equal(await next, true)
	})
}

for (const failure of ['construct', 'check', 'evaluate', 'cleanup']) {
	test(`${failure} failure does not reject or hold the active slot`, async () => {
		const { biometrics, contexts } = load({ failure })
		const pending = biometrics.verify('Unlock')
		if (failure === 'cleanup') {
			contexts[0].reply(false, null)
		}

		assert.equal(await pending, false)
		const next = biometrics.verify('Again')
		if (failure === 'cleanup') {
			contexts[1].reply(false, null)
		}

		assert.equal(await next, false)
	})
}

test('empty reasons do not open a prompt', async () => {
	const { biometrics, contexts } = load()
	assert.equal(await biometrics.verify('  '), false)
	assert.equal(contexts.length, 0)
})
