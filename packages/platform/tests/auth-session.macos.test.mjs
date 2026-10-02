import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpile(
	await readFile(new URL('../src/auth-session.macos.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)

const domain = 'com.apple.AuthenticationServices.WebAuthenticationSession'
function load({ failure, start = true, presentationWindow = {}, available = true } = {}) {
	const sessions = []
	const context = {
		exports: {},
		objc: { import() {} },
		NSURL: { URLWithString: (url) => ({ host: url.includes('invalid') ? '' : 'example.test' }) },
		NSApplication: { sharedApplication: { keyWindow: presentationWindow } },
		NSObject: {
			extend(methods) {
				if (failure === 'extend') {
					throw new Error('extend failed')
				}

				return { new: () => ({ ...methods }) }
			},
		},
		interop: { types: { id: {}, void: {} } },
		ASWebAuthenticationPresentationContextProviding: {},
	}

	if (available) {
		context.ASWebAuthenticationSession = {
			alloc: () => ({
				initWithURLCallbackURLSchemeCompletionHandler(url, scheme, completion) {
					if (failure === 'construct') {
						throw new Error('construction failed')
					}

					const session = {
						completion,
						start() {
							if (failure === 'start') {
								throw new Error('start failed')
							}

							return start
						},
					}

					sessions.push(session)
					return session
				},
			}),
		}
	}

	vm.runInNewContext(source, context)
	return { auth: context.exports.authSession, sessions }
}

const open = (h) =>
	h.auth.impl.open('https://example.test/login', {
		callbackScheme: 'sample',
		prefersEphemeralSession: true,
	})

test('macOS success, cancellation, errors and empty completion release the session for retry', async () => {
	for (const [url, error, type] of [
		[{ absoluteString: 'sample://callback?code=one' }, null, 'success'],
		[null, { domain, code: 1 }, 'cancel'],
		[null, { domain, code: 2, localizedDescription: 'no presentation context' }, 'error'],
		[null, { domain: 'other', code: 1, localizedDescription: 'cannot cancel request' }, 'error'],
		[null, null, 'cancel'],
		[{ absoluteString: 'other://callback' }, null, 'error'],
		[
			{
				get absoluteString() {
					throw new Error('decode failed')
				},
			},
			null,
			'error',
		],
	]) {
		const h = load()
		const first = open(h)
		assert.equal(h.sessions[0].prefersEphemeralWebBrowserSession, true)
		assert.ok(h.sessions[0].presentationContextProvider)
		assert.equal((await open(h)).type, 'error')
		h.sessions[0].completion(url, error)
		assert.equal((await first).type, type)
		const second = open(h)
		// Late completion from a previous attempt must not release the new one.
		h.sessions[0].completion(null, null)
		assert.equal((await open(h)).type, 'error')
		h.sessions[1].completion({ absoluteString: 'sample://callback?code=two' }, null)
		assert.equal((await second).type, 'success')
	}
})

test('macOS setup exceptions, failed start and absent windows resolve errors without locking retry', async () => {
	for (const options of [
		{ failure: 'extend' },
		{ failure: 'construct' },
		{ failure: 'start' },
		{ start: false },
		{ presentationWindow: null },
	]) {
		const h = load(options)
		assert.equal((await open(h)).type, 'error')
		assert.doesNotMatch((await open(h)).message, /already active/)
	}
})

test('macOS validates launch URL/scheme and reports unavailable capability honestly', async () => {
	const h = load()
	for (const [url, scheme] of [
		['file:///login', 'sample'],
		['https://invalid', 'sample'],
		['https://example.test', 'sample:'],
		['https://example.test', ''],
		['https://example.test', null],
	]) {
		assert.equal((await h.auth.impl.open(url, { callbackScheme: scheme })).type, 'error')
	}

	const absent = load({ available: false }).auth
	assert.equal(absent.supported, false)
	assert.equal(absent.impl, null)
	assert.equal(await absent.ensure(), 'unsupported')
})
