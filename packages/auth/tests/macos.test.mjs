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
function loadApple({ failure, presentationWindow = {}, state = 1, stateError = null } = {}) {
	const controllers = [],
		requests = []

	const exports = {}
	vm.runInNewContext(apple, {
		exports,
		require: (id) => (id === './sha256' ? sha256Module : {}),
		objc: { import() {} },
		NSApplication: { sharedApplication: { keyWindow: presentationWindow } },
		NSObject: {
			extend: (methods) => {
				if (failure === 'extend') {
					throw new Error('extend failed')
				}

				return { new: () => ({ ...methods }) }
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
				return {
					createRequest() {
						if (failure === 'request') {
							throw new Error('request failed')
						}

						const request = {}
						requests.push(request)
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
			alloc: () => ({
				initWithAuthorizationRequests() {
					if (failure === 'construct') {
						throw new Error('construction failed')
					}

					const controller = {
						performRequests() {
							if (failure === 'perform') {
								throw new Error('perform failed')
							}
						},
					}

					controllers.push(controller)
					return controller
				},
			}),
		},
	})

	return { auth: exports.appleAuth, controllers, requests }
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
	succeed(h.controllers[0])
	const result = await first
	assert.equal(result.status, 'success')
	assert.equal(result.credential.user.name, 'First Last')
	assert.equal(result.credential.authorizationCode, 'auth-code')
	const second = h.auth.signIn()
	fail(h.controllers[0], { domain, code: 1001 })
	assert.equal((await h.auth.signIn()).status, 'error')
	fail(h.controllers[1], { domain, code: 1001 })
	assert.equal((await second).status, 'cancelled')
})

test('Apple distinguishes cancellation from same-code foreign errors and conversion failures', async () => {
	for (const [error, status] of [
		[{ domain, code: 1001 }, 'cancelled'],
		[{ domain: 'other', code: 1001 }, 'error'],
		[{ domain, code: 1000, localizedDescription: 'cancel not possible' }, 'error'],
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

const google = await compile('google.macos')
function loadGoogle(session) {
	const exports = {}
	vm.runInNewContext(google, {
		exports,
		require: () => ({ authSession: { supported: !!session, impl: session } }),
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
