import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (file) =>
	ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const apple = await compile('apple.macos')
const sha256Module = {}
vm.runInNewContext(await compile('sha256'), { exports: sha256Module })
const domain = 'com.apple.AuthenticationServices.AuthorizationError'
function loadApple({ failure, presentationWindow = { visible: true }, state = 1, stateError = null,
	onObserve, onExtend, onDelegateNew, onAnchorNew, onProviderNew, onRequest, onScopes, onNonce,
	onAlloc, onConstruct, onDelegate, onAnchor, onPerform, onCancel, missingCancel = false } = {}) {
	const controllers = [],
		requests = []

	const exports = {}, observers = new Set()
	const app = { keyWindow: presentationWindow }
	let classCount = 0
	vm.runInNewContext(apple, {
		exports,
		require: (id) => (id === './sha256' ? sha256Module : {}),
		objc: { import() {} },
		NSApplication: { sharedApplication: app },
		NSWindowWillCloseNotification: 'close', NSApplicationWillTerminateNotification: 'terminate',
		NSOperationQueue: { mainQueue: {} },
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(name, object, queue, callback) {
				if (failure === 'observe' || (failure === 'observe-second' && observers.size === 1)) {throw Error('observe failed')}
				const token = { name, object, callback }; observers.add(token); onObserve?.(token); return token
			},
			removeObserver(token) { if (failure === 'remove') {throw Error('remove failed');} observers.delete(token) },
		} },
		NSObject: {
			extend: (methods) => {
				classCount++
				if (failure === 'extend-anchor-once' && classCount === 2) {throw Error('anchor registration failed')}
				if (failure === 'extend') {
					throw new Error('extend failed')
				}

				const anchor = 'presentationAnchorForAuthorizationController' in methods
				onExtend?.(anchor ? 'anchor' : 'delegate')
				return { new: () => { const instance = { ...methods }; (anchor ? onAnchorNew : onDelegateNew)?.(instance); return instance } }
			},
		},
		NSString: {
			stringWithString: (s) => ({ dataUsingEncoding: () => Buffer.from(s) }),
			alloc: () => ({ initWithDataEncoding: (d) => d }),
		},
		interop: { types: { id: {}, void: {} }, bufferFromData: (d) => d },
		ASAuthorizationControllerDelegate: {},
		ASAuthorizationControllerPresentationContextProviding: {},
		ASAuthorizationScopeEmail: 'email',
		ASAuthorizationScopeFullName: 'name',
		ASAuthorizationAppleIDProvider: {
			new() {
				onProviderNew?.()
				return {
					createRequest() {
						if (failure === 'request') {
							throw new Error('request failed')
						}

						let scopes, nonce
						const request = {
							get requestedScopes() { return scopes }, set requestedScopes(value) { onScopes?.(value); scopes = value },
							get nonce() { return nonce }, set nonce(value) { onNonce?.(value); nonce = value },
						}
						requests.push(request); onRequest?.(request)
						return request
					},
					getCredentialStateForUserIDCompletion(_id, fn) {
						if (failure === 'state') {
							throw new Error('state failed')
						}

						fn(state, stateError)
					},
				}
			},
		},
		ASAuthorizationController: {
			alloc() {
				onAlloc?.()
				return { initWithAuthorizationRequests() {
					if (failure === 'construct') {throw new Error('construction failed')}
					let delegate = null, anchor = null
					const controller = {
						performs: 0, cancels: 0,
						get delegate() { return delegate }, set delegate(value) { onDelegate?.(controller, value); delegate = value },
						get presentationContextProvider() { return anchor }, set presentationContextProvider(value) { onAnchor?.(controller, value); anchor = value },
						performRequests() {
							this.performs++; onPerform?.(controller)
							if (failure === 'perform') {throw new Error('perform failed')}
						},
					}
					if (!missingCancel) {controller.cancel = () => { controller.cancels++; onCancel?.(controller) }}
					controllers.push(controller); onConstruct?.(controller)
					return controller
				} }
			},
		},
	})

	return { auth: exports.appleAuth, controllers, requests, app, observers, get classCount() { return classCount },
		post(name, object) { for (const token of [...observers]) {if (token.name === name && (token.object == null || token.object === object)) {token.callback({ object })}} },
	}
}

const credential = () => ({
	user: 'user-id',
	email: 'name@example.test',
	fullName: { givenName: 'First', familyName: 'Last' },
	authorizedScopes: ['email', 'name'],
	valueForKey: (key) => (key === 'identityToken' ? 'id-token' : 'auth-code'),
})

const fail = (c, error) => c.delegate.authorizationControllerDidCompleteWithError(c, error)
const succeed = (c, value = credential()) =>
	c.delegate.authorizationControllerDidCompleteWithAuthorization(c, { credential: value })

test('Apple maps credentials, hashes UTF-8 nonce, rejects overlap, and ignores old delegates after retry', async () => {
	const h = loadApple()
	const first = h.auth.signIn({ scopes: ['email', 'name'], nonce: 'nönce 🍎' })
	assert.equal(h.requests[0].nonce, createHash('sha256').update('nönce 🍎').digest('hex'))
	assert.equal((await h.auth.signIn()).status, 'error')
	const oldDelegate = h.controllers[0].delegate
	succeed(h.controllers[0])
	const result = await first
	assert.equal(result.status, 'success')
	assert.equal(result.credential.user.name, 'First Last')
	assert.equal(result.credential.authorizationCode, 'auth-code')
	const second = h.auth.signIn()
	assert.equal(h.controllers[0].delegate, null)
	assert.equal(h.controllers[0].presentationContextProvider, null)
	assert.equal(h.observers.size, 2) // only the replacement owns observers
	oldDelegate.authorizationControllerDidCompleteWithError(h.controllers[0], { domain, code: 1001 })
	assert.equal((await h.auth.signIn()).status, 'error')
	fail(h.controllers[1], { domain, code: 1001 })
	assert.equal((await second).status, 'cancelled')
})

test('Apple distinguishes cancellation from same-code foreign errors and conversion failures', async () => {
	for (const [error, status] of [
		[{ domain, code: 1001 }, 'cancelled'],
		[{ domain: 'other', code: 1001 }, 'error'],
		[{ domain, code: 1000, localizedDescription: 'cancel not possible' }, 'error'],
		[{ get domain() { throw Error('native error metadata failed') } }, 'error'],
	]) {
		const h = loadApple()
		const p = h.auth.signIn()
		fail(h.controllers[0], error)
		assert.equal((await p).status, status)
	}

	const h = loadApple()
	const p = h.auth.signIn()
	succeed(h.controllers[0], {
		valueForKey() {
			throw new Error('decode failed')
		},
	})

	assert.equal((await p).status, 'error')
	const retry = h.auth.signIn()
	succeed(h.controllers[1], { ...credential(), user: '' })
	assert.equal((await retry).status, 'error')
})

test('Apple setup and credential-state failures have stable results and allow retry', async () => {
	for (const options of [
		{ failure: 'extend' },
		{ failure: 'request' },
		{ failure: 'construct' },
		{ failure: 'perform' },
		{ presentationWindow: null },
	]) {
		const h = loadApple(options)
		assert.equal((await h.auth.signIn()).status, 'error')
		assert.doesNotMatch((await h.auth.signIn()).message, /already active/)
	}

	for (const [state, expected] of [
		[0, 'revoked'],
		[1, 'authorized'],
		[2, 'notFound'],
		[3, 'transferred'],
		[9, 'unknown'],
	]) {
		assert.equal(await loadApple({ state }).auth.getCredentialState('id'), expected)
	}

	assert.equal(await loadApple({ failure: 'state' }).auth.getCredentialState('id'), 'unknown')
	assert.equal(await loadApple({ stateError: {} }).auth.getCredentialState('id'), 'unknown')
})

test('Apple pins eligible initiating windows and rejects stale/foreign controller and delegate callbacks', async () => {
	const h = loadApple(), firstWindow = h.app.keyWindow
	const pending = h.auth.signIn(), c = h.controllers[0], delegate = c.delegate, anchor = c.presentationContextProvider
	h.app.keyWindow = { visible: true }
	assert.equal(anchor.presentationAnchorForAuthorizationController(c), firstWindow)
	assert.equal(anchor.presentationAnchorForAuthorizationController({}), null)
	const unreadable = { get credential() { throw Error('foreign credential must not be read') } }
	delegate.authorizationControllerDidCompleteWithAuthorization({}, unreadable)
	delegate.authorizationControllerDidCompleteWithError({}, { domain, code: 1001 })
	c.isEqual = (other) => other?.sameController === true
	assert.equal(anchor.presentationAnchorForAuthorizationController({ sameController: true }), firstWindow)
	firstWindow.visible = false
	assert.equal(anchor.presentationAnchorForAuthorizationController(c), null)
	fail(c, { domain, code: 1001 }); await pending
	const retry = h.auth.signIn(), next = h.controllers[1]
	assert.equal(anchor.presentationAnchorForAuthorizationController(next), null)
	delegate.authorizationControllerDidCompleteWithAuthorization(next, unreadable)
	assert.match((await h.auth.signIn()).message, /already active/)
	fail(next, { domain, code: 1001 }); await retry
	for (const window of [null, { visible: false }, { visible: true, attachedSheet: {} }]) {
		const other = loadApple({ presentationWindow: window })
		other.app.windows = { firstObject: { visible: true } }
		assert.equal((await other.auth.signIn()).status, 'error')
		other.app.mainWindow = { visible: 1 }
		const pending = other.auth.signIn(), c = other.controllers[0]
		assert.equal(c.presentationContextProvider.presentationAnchorForAuthorizationController(c), other.app.mainWindow)
		fail(c, { domain, code: 1001 }); await pending
	}
})

test('Apple close/termination retires delegates, observers and controller once, permitting retry', async () => {
	for (const event of ['close', 'terminate']) {
		const h = loadApple(), pending = h.auth.signIn(), c = h.controllers[0], delegate = c.delegate
		const staleObserver = [...h.observers][0]
		h.post('close', {}); assert.equal(c.cancels, 0)
		h.post(event, event === 'close' ? h.app.keyWindow : h.app)
		assert.equal((await pending).status, 'cancelled'); assert.equal(c.cancels, 1)
		assert.equal(c.delegate, null); assert.equal(c.presentationContextProvider, null); assert.equal(h.observers.size, 0)
		const retry = h.auth.signIn(), next = h.controllers[1]
		staleObserver.callback()
		delegate.authorizationControllerDidCompleteWithAuthorization(c, { get credential() { throw Error('retired credential must not be read') } })
		assert.equal(next.cancels, 0)
		fail(next, { domain, code: 1001 }); await retry
	}
})

test('Apple cancellation throws or missing pre-macOS-13 cancel do not lock JS ownership', async () => {
	for (const options of [{ onCancel() { throw Error('cancel failed') } }, { missingCancel: true }]) {
		const h = loadApple(options), pending = h.auth.signIn()
		h.post('close', h.app.keyWindow)
		assert.equal((await pending).status, 'cancelled'); assert.equal(h.observers.size, 0)
		const retry = h.auth.signIn(); fail(h.controllers[1], { domain, code: 1001 }); await retry
	}
})

test('Apple captures scopes and nonce before native provider reentry', async () => {
	const options = { scopes: ['email'], nonce: 'original' }
	const h = loadApple({ onRequest() { options.scopes[0] = 'name'; options.nonce = 'replacement' } })
	const pending = h.auth.signIn(options)
	assert.equal(Array.from(h.requests[0].requestedScopes).join(','), 'email')
	assert.equal(h.requests[0].nonce, createHash('sha256').update('original').digest('hex'))
	fail(h.controllers[0], { domain, code: 1001 }); await pending
})

test('Apple can retry a failed anchor class registration without discarding the cached delegate class', async () => {
	const h = loadApple({ failure: 'extend-anchor-once' })
	assert.equal((await h.auth.signIn()).status, 'error'); assert.equal(h.observers.size, 0)
	const retry = h.auth.signIn()
	assert.equal(h.classCount, 3); assert.equal(h.controllers.length, 1)
	fail(h.controllers[0], { domain, code: 1001 }); await retry
})

test('Apple observer setup failures and synchronous registration teardown acquire no controller', async () => {
	for (const options of [{ failure: 'observe' }, { failure: 'observe-second' }, { onObserve(token) { token.callback() } }]) {
		const h = loadApple(options)
		const result = await h.auth.signIn()
		assert.equal(result.status, options.onObserve ? 'cancelled' : 'error')
		assert.equal(h.observers.size, 0); assert.equal(h.controllers.length, 0)
	}
})

test('Apple setup reentry never performs a retired authorization request', async () => {
	for (const stage of ['extend', 'delegateNew', 'providerNew', 'request', 'scopes', 'nonce', 'anchorNew', 'alloc', 'construct', 'delegate', 'anchor']) {
		let h
		const close = () => h.post('close', h.app.keyWindow)
		h = loadApple({ onExtend: stage === 'extend' ? close : undefined,
			onDelegateNew: stage === 'delegateNew' ? close : undefined, onProviderNew: stage === 'providerNew' ? close : undefined,
			onRequest: stage === 'request' ? close : undefined, onScopes: stage === 'scopes' ? close : undefined,
			onNonce: stage === 'nonce' ? close : undefined, onAnchorNew: stage === 'anchorNew' ? close : undefined,
			onAlloc: stage === 'alloc' ? close : undefined, onConstruct: stage === 'construct' ? close : undefined,
			onDelegate: stage === 'delegate' ? (_c, value) => { if (value) {close()} } : undefined,
			onAnchor: stage === 'anchor' ? (_c, value) => { if (value) {close()} } : undefined })
		assert.equal((await h.auth.signIn({ scopes: ['email'], nonce: 'sample' })).status, 'cancelled')
		assert.equal(h.observers.size, 0)
		for (const c of h.controllers) {
			assert.equal(c.performs, 0); assert.equal(c.cancels, 1)
			assert.equal(c.delegate, null); assert.equal(c.presentationContextProvider, null)
		}
	}
})

test('Apple ignores results from conversion reentry and preserves synchronous terminal ownership', async () => {
	const h = loadApple({ onPerform(c) { succeed(c) }, failure: 'remove' })
	assert.equal((await h.auth.signIn()).status, 'success')
	const staleTokens = [...h.observers]
	assert.equal((await h.auth.signIn()).status, 'success')
	for (const token of staleTokens) {token.callback()}
	assert.equal(h.controllers[1].cancels, 0)
	const reentry = loadApple(), pending = reentry.auth.signIn(), c = reentry.controllers[0]
	const value = credential()
	value.valueForKey = () => { reentry.post('close', reentry.app.keyWindow); return 'retired-token' }
	succeed(c, value)
	assert.equal((await pending).status, 'cancelled'); assert.equal(c.cancels, 1)
})

const google = await compile('google.macos')
function loadGoogle(session) {
	const exports = {}
	vm.runInNewContext(google, {
		exports,
		require: () => ({
			authSession: { supported: !!session, open: (url, options) => session.open(url, options) },
		}),
	})

	return exports.googleAuth
}

const googleCredential = {
	provider: 'google',
	idToken: 'token',
	scopes: ['openid'],
	user: { id: 'subject' },
}

const flow = (overrides = {}) => ({
	createRequest: async () => ({ url: 'https://example.test/login', callbackScheme: 'sample' }),
	complete: async () => googleCredential,
	...overrides,
})

test('Google hosted adapter forwards nonce, uses ephemeral browser, completes credential and logs out', async () => {
	let nonce,
		opened,
		requested,
		signedOut = false

	const auth = loadGoogle({
		open: async (url, options) => {
			opened = { url, options }
			return { type: 'success', url: 'sample://callback?code=one' }
		},
	})

	assert.equal((await auth.signIn()).status, 'error')
	await auth.configure({
		scopes: ['email'],
		hostedDomain: 'example.test',
		clientId: 'client',
		hostedFlow: flow({
			createRequest: async (options) => {
				requested = options
				nonce = options.nonce
				return { url: 'https://example.test/login', callbackScheme: 'sample' }
			},
			complete: async (url) => {
				assert.equal(url, 'sample://callback?code=one')
				return googleCredential
			},
			signOut: async () => {
				signedOut = true
			},
		}),
	})

	assert.equal((await auth.signIn({ nonce: 'backend-nonce' })).status, 'success')
	assert.equal(nonce, 'backend-nonce')
	assert.equal(requested.scopes[0], 'email')
	assert.equal(requested.hostedDomain, 'example.test')
	assert.equal(requested.clientId, 'client')
	assert.equal(opened.options.prefersEphemeralSession, true)
	await auth.signOut()
	assert.ok(signedOut)
})

test('Google hosted cancellation, errors, malformed credentials and concurrent/reconfigured attempts', async () => {
	for (const [sessionResult, expected] of [
		[{ type: 'cancel' }, 'cancelled'],
		[{ type: 'error', message: 'failed' }, 'error'],
	]) {
		const auth = loadGoogle({ open: async () => sessionResult })
		await auth.configure({
			hostedFlow: flow({
				complete: () => {
					throw new Error('must not complete')
				},
			}),
		})

		assert.equal((await auth.signIn()).status, expected)
	}

	for (const override of [
		{
			createRequest: async () => {
				throw new Error('backend offline')
			},
		},
		{ createRequest: async () => ({ url: 'http://insecure.test', callbackScheme: 'sample' }) },
		{
			complete: async () => {
				throw new Error('state mismatch')
			},
		},
		{ complete: async () => ({ ...googleCredential, provider: 'apple' }) },
	]) {
		const auth = loadGoogle({ open: async () => ({ type: 'success', url: 'sample://callback' }) })
		await auth.configure({ hostedFlow: flow(override) })
		assert.equal((await auth.signIn()).status, 'error')
		assert.doesNotMatch((await auth.signIn()).message, /already active/)
	}

	let resolve
	const auth = loadGoogle({
		open: () =>
			new Promise((r) => {
				resolve = r
			}),
	})

	await auth.configure({ hostedFlow: flow() })
	const first = auth.signIn()
	await Promise.resolve()
	assert.equal((await auth.signIn()).status, 'error')
	await auth.configure()
	resolve({ type: 'success', url: 'sample://callback' })
	assert.equal((await first).status, 'success')
	assert.equal((await auth.signIn()).status, 'error')
	assert.equal(loadGoogle(null).supported, false)
})

test('Google signOut resolves even when the hosted backend logout fails', async () => {
	const auth = loadGoogle(null)
	await auth.configure({
		hostedFlow: flow({
			signOut: async () => {
				throw new Error('backend offline')
			},
		}),
	})

	await auth.signOut()

	await loadGoogle(null).configure({ hostedFlow: flow() })
})
