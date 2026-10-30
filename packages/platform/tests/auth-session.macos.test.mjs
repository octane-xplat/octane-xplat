import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const requireLib = createRequire(import.meta.url)

const source = ts.transpile(
	await readFile(new URL('../src/auth-session.macos.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)

const domain = 'com.apple.AuthenticationServices.WebAuthenticationSession'
function load({ failure, start = true, presentationWindow = { visible: true }, available = true,
	onConstruct, onStart, onCancel, onObserve, onEphemeral, onProvider, onExtend, onAnchor } = {}) {
	const sessions = []
	const observers = new Set()
	const context = {
		exports: {},
		require: (id) => requireLib(id),
		objc: { import() {} },
		NSURL: { URLWithString: (url) => ({ host: url.includes('invalid') ? '' : 'example.test' }) },
		NSApplication: { sharedApplication: { keyWindow: presentationWindow } },
		NSObject: {
			extend(methods) {
				if (failure === 'extend') {
					throw new Error('extend failed')
				}

				onExtend?.()
				return { new: () => { onAnchor?.(); return { ...methods } } }
			},
		},
		interop: { types: { id: {}, void: {} } },
		ASWebAuthenticationPresentationContextProviding: {},
		NSWindowWillCloseNotification: 'close',
		NSApplicationWillTerminateNotification: 'terminate',
		NSOperationQueue: { mainQueue: {} },
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(name, object, queue, callback) {
				if (failure === 'observe' || (failure === 'observe-second' && observers.size === 1)) {throw Error('observer failed')}
				const token = { name, object, callback }; observers.add(token); onObserve?.(token)
				return token
			},
			removeObserver(token) {
				if (failure === 'remove') {throw Error('remove failed')}
				observers.delete(token)
			},
		} },
	}

	if (available) {
		context.ASWebAuthenticationSession = {
			alloc: () => ({
				initWithURLCallbackURLSchemeCompletionHandler(url, scheme, completion) {
					if (failure === 'construct') {
						throw new Error('construction failed')
					}

					let provider = null, ephemeral = false
					const session = {
						completion, url, scheme, starts: 0, cancels: 0,
						get presentationContextProvider() { return provider },
						set presentationContextProvider(value) { onProvider?.(session, value); provider = value },
						get prefersEphemeralWebBrowserSession() { return ephemeral },
						set prefersEphemeralWebBrowserSession(value) { onEphemeral?.(session, value); ephemeral = value },
						cancel() { this.cancels++; onCancel?.(session); completion(null, { domain, code: 1 }) },
						start() {
							this.starts++; onStart?.(session)
							if (failure === 'start') {
								throw new Error('start failed')
							}

							return start
						},
					}

					sessions.push(session)
					onConstruct?.(session)
					return session
				},
			}),
		}
	}

	vm.runInNewContext(source, context)
	return { auth: context.exports.authSession, sessions, observers, app: context.NSApplication.sharedApplication,
		post(name, object) { for (const token of [...observers]) {if (token.name === name && (token.object == null || token.object === object)) {token.callback({ object })}} },
	}
}

const open = (h) =>
	h.auth.open('https://example.test/login', {
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
		assert.equal(h.observers.size, 0)
		assert.equal(h.sessions[0].presentationContextProvider, null)
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
		assert.equal((await h.auth.open(url, { callbackScheme: scheme })).type, 'error')
	}

	const absent = load({ available: false }).auth
	assert.equal(absent.supported, false)
	assert.equal(await absent.isAvailable(), false)
	await assert.rejects(absent.open('https://example.test/login', { callbackScheme: 'sample' }), {
		name: 'UnavailabilityError',
	})
})

test('macOS snapshots callback scheme and ephemeral options for the whole attempt', async () => {
	let reads = 0
	const options = { get callbackScheme() { reads++; return 'sample' }, prefersEphemeralSession: true }
	const h = load()
	const pending = h.auth.open('https://example.test/login', options)
	Object.defineProperty(options, 'callbackScheme', { value: 'other' }); options.prefersEphemeralSession = false
	assert.equal(reads, 1); assert.equal(h.sessions[0].scheme, 'sample')
	assert.equal(h.sessions[0].prefersEphemeralWebBrowserSession, true)
	h.sessions[0].completion({ absoluteString: 'sample://callback' }, null)
	assert.equal((await pending).type, 'success')
	const mutated = { callbackScheme: 'sample' }
	const second = h.auth.open('https://example.test/login', mutated); mutated.callbackScheme = 'other'
	h.sessions[1].completion({ absoluteString: 'other://callback' }, null)
	assert.equal((await second).type, 'error')
})

test('macOS pins the initiating window and rejects foreign/stale anchor requests', async () => {
	const h = load(), firstWindow = h.app.keyWindow
	const pending = open(h), session = h.sessions[0], provider = session.presentationContextProvider
	h.app.keyWindow = { visible: true }
	assert.equal(provider.presentationAnchorForWebAuthenticationSession(session), firstWindow)
	assert.equal(provider.presentationAnchorForWebAuthenticationSession({}), null)
	session.isEqual = (other) => other?.sameSession === true
	assert.equal(provider.presentationAnchorForWebAuthenticationSession({ sameSession: true }), firstWindow)
	firstWindow.visible = false
	assert.equal(provider.presentationAnchorForWebAuthenticationSession(session), null)
	session.completion(null, null); await pending
	const second = open(h)
	assert.equal(provider.presentationAnchorForWebAuthenticationSession(session), null)
	h.sessions[1].completion(null, null); await second
})

test('macOS uses an eligible main window but never an arbitrary hidden/orphan window', async () => {
	for (const window of [{ visible: false }, { visible: true, attachedSheet: {} }, null]) {
		const h = load({ presentationWindow: window })
		h.app.windows = { firstObject: { visible: true } }
		assert.equal((await open(h)).type, 'error')
		h.app.mainWindow = { visible: 1 }
		const pending = open(h), session = h.sessions[0]
		assert.equal(session.presentationContextProvider.presentationAnchorForWebAuthenticationSession(session), h.app.mainWindow)
		session.completion(null, null); await pending
	}
})

test('macOS window close retires the native attempt once, then permits retry', async () => {
	const h = load(), pending = open(h), old = h.sessions[0]
	const staleObserver = [...h.observers][0]
	h.post('close', {}); assert.equal(old.cancels, 0)
	h.post('close', h.app.keyWindow)
	assert.equal((await pending).type, 'cancel'); assert.equal(old.cancels, 1)
	assert.equal(h.observers.size, 0); assert.equal(old.presentationContextProvider, null)
	const second = open(h)
	staleObserver.callback(); old.completion({ get absoluteString() { throw Error('stale callback must not decode') } }, null)
	assert.equal(h.sessions[1].cancels, 0)
	assert.match((await open(h)).message, /already active/)
	h.sessions[1].completion(null, null); await second
})

test('macOS application termination settles cancellation even if native cancel throws', async () => {
	const h = load({ onCancel() { throw Error('cancel failed') } })
	const pending = open(h)
	h.post('terminate', h.app)
	assert.equal((await pending).type, 'cancel'); assert.equal(h.observers.size, 0)
	assert.equal(h.sessions[0].cancels, 1)
})

test('macOS partial or synchronous observer setup retires every acquired token', async () => {
	const failed = load({ failure: 'observe-second' })
	assert.equal((await open(failed)).type, 'error'); assert.equal(failed.observers.size, 0)
	assert.equal(failed.sessions.length, 0)
	const synchronous = load({ onObserve(token) { token.callback() } })
	assert.equal((await open(synchronous)).type, 'cancel')
	assert.equal(synchronous.observers.size, 0); assert.equal(synchronous.sessions.length, 0)
})

test('macOS constructor/setup reentry cannot start or retain a retired native session', async () => {
	for (const stage of ['extend', 'anchor', 'construct', 'ephemeral', 'provider']) {
		let h
		const close = () => h.post('close', h.app.keyWindow)
		h = load({ onExtend: stage === 'extend' ? close : undefined, onAnchor: stage === 'anchor' ? close : undefined,
			onConstruct: stage === 'construct' ? close : undefined,
			onEphemeral: stage === 'ephemeral' ? close : undefined,
			onProvider: stage === 'provider' ? (_session, value) => { if (value) {close()} } : undefined })
		assert.equal((await open(h)).type, 'cancel')
		if (stage === 'extend' || stage === 'anchor') { assert.equal(h.sessions.length, 0); assert.equal(h.observers.size, 0); continue }
		assert.equal(h.sessions[0].starts, 0); assert.equal(h.sessions[0].cancels, 1)
		assert.equal(h.sessions[0].presentationContextProvider, null); assert.equal(h.observers.size, 0)
	}
})

test('macOS synchronous completion wins over a failed start and cleanup failures cannot resurrect ownership', async () => {
	const h = load({ start: false, failure: 'remove', onStart(session) { session.completion({ absoluteString: 'sample://callback' }, null) } })
	assert.equal((await open(h)).type, 'success')
	assert.equal(h.sessions[0].cancels, 0)
	const oldTokens = [...h.observers]
	assert.equal((await open(h)).type, 'success')
	for (const token of oldTokens) {token.callback()}
	assert.equal(h.sessions[1].cancels, 0)
})
