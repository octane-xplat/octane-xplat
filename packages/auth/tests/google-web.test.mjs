import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (file) =>
	ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const googleWeb = await compile('google.web')

// A fake GIS SDK + just enough `document` for the lazy script load — the
// script tag resolves `globalThis.google` on onload.
function loadWeb({ clientId = 'client-id', prompt } = {}) {
	const calls = { initialize: [], prompt: [], renderButton: [] }
	const fakeGoogle = {
		accounts: {
			id: {
				initialize: (options) => calls.initialize.push(options),
				renderButton: (host, options) => calls.renderButton.push({ host, options }),
				prompt: (callback) => {
					calls.prompt.push(callback)
					prompt?.(callback)
				},
				disableAutoSelect: () => (calls.disableAutoSelect = true),
			},
		},
	}

	const context = {
		exports: {},
		require: () => ({}),
		document: {
			createElement: () => ({}),
			head: { appendChild: (el) => queueMicrotask(() => el.onload?.()) },
		},
		google: fakeGoogle,
		TextDecoder,
		atob: (value) => Buffer.from(value, 'base64').toString('binary'),
	}

	vm.runInNewContext(googleWeb, context)
	const mod = context.exports
	mod.googleAuth.configure({ clientId })
	return { calls, fakeGoogle, ...mod }
}

const host = () => ({ isConnected: true })

// The lazy script load resolves through a microtask after appendChild — let
// it settle before asserting on prompt/initialize calls.
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('a rendered button parks the single credential slot; a second flow refuses', async () => {
	const { renderGoogleButton, calls } = loadWeb()

	const first = []
	const second = []
	const hostA = host()
	const hostB = host()
	await renderGoogleButton(hostA, {}, (r) => first.push(r))
	await renderGoogleButton(hostB, {}, (r) => second.push(r))

	assert.equal(first.length, 0)
	assert.equal(second.length, 1)
	assert.match(second[0].message, /already active/)
	assert.equal(calls.renderButton.length, 1)
})

test('a mounted button blocks a headless prompt until the host disconnects', async () => {
	const { googleAuth, renderGoogleButton, calls } = loadWeb()

	const buttonHost = host()
	await renderGoogleButton(buttonHost, {}, () => {})

	const blocked = await googleAuth.signIn()
	assert.equal(blocked.status, 'error')
	assert.match(blocked.message ?? '', /already active/)

	buttonHost.isConnected = false
	const pending = googleAuth.signIn()
	await tick()
	calls.prompt[0]({ isNotDisplayed: () => true })
	assert.equal((await pending).status, 'cancelled')
})

test('a pending prompt blocks a button render and resolves its own credential', async () => {
	const { googleAuth, renderGoogleButton, calls } = loadWeb()
	const pending = googleAuth.signIn()
	await tick()

	const results = []
	await renderGoogleButton(host(), {}, (r) => results.push(r))
	assert.equal(results.length, 1)
	assert.match(results[0].message, /already active/)
	assert.equal(calls.renderButton.length, 0)

	calls.prompt[0]({ isSkippedMoment: () => true })
	assert.equal((await pending).status, 'cancelled')
})

test('a re-fired ref on the same host does not re-render or re-park', async () => {
	const { renderGoogleButton, calls } = loadWeb()
	const buttonHost = host()

	await renderGoogleButton(buttonHost, {}, () => {})
	await renderGoogleButton(buttonHost, {}, () => {})

	assert.equal(calls.renderButton.length, 1)
})

test('the rendered button wires onPress through the GIS click_listener', async () => {
	const { renderGoogleButton, calls } = loadWeb()
	let presses = 0
	await renderGoogleButton(host(), { onPress: () => presses++ }, () => {})

	assert.equal(typeof calls.renderButton[0].options.click_listener, 'function')
	calls.renderButton[0].options.click_listener()
	assert.equal(presses, 1)
})

test('a signIn nonce reaches its own initialize and does not bleed into the button', async () => {
	const { googleAuth, renderGoogleButton, calls } = loadWeb()

	const pending = googleAuth.signIn({ nonce: 'prompt-nonce' })
	await tick()
	calls.prompt[0]({ isNotDisplayed: () => true })
	assert.equal((await pending).status, 'cancelled')
	assert.equal(calls.initialize[0].nonce, 'prompt-nonce')

	await renderGoogleButton(host(), {}, () => {})
	assert.equal(calls.initialize[1].nonce, undefined)
})
