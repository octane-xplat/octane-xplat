import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (name) =>
	ts.transpile(await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const native = await compile('auth-session')
function emitter() {
	const listeners = new Map()
	return {
		on(name, fn) {
			const group = listeners.get(name) ?? new Set()
			group.add(fn)
			listeners.set(name, group)
		},
		off(name, fn) {
			listeners.get(name)?.delete(fn)
		},
		emit(name, args) {
			for (const fn of [...(listeners.get(name) ?? [])]) {
				fn(args)
			}
		},
		count() {
			return [...listeners.values()].reduce((n, group) => n + group.size, 0)
		},
	}
}

function load({
	ios = false,
	initialUrl,
	launch = () => true,
	start = () => true,
	constructError,
} = {}) {
	const app = { ...emitter(), android: emitter(), ios, resumeEvent: 'resume' }
	let intentUrl = initialUrl
	let completion
	const session = { start, prefersEphemeralWebBrowserSession: false }
	const activity = { getIntent: () => ({ getDataString: () => intentUrl }) }
	app.android.foregroundActivity = activity
	const exports = {}
	vm.runInNewContext(native, {
		exports,
		require: () => ({
			Application: app,
			Utils: { android: { getCurrentActivity: () => activity }, openUrl: launch },
		}),
		android: { net: { Uri: { parse: (s) => s } } },
		NSURL: { URLWithString: (s) => (s === 'invalid' ? null : s) },
		NSObject: { extend: () => ({ new: () => ({}) }) },
		ASWebAuthenticationPresentationContextProviding: {},
		ASWebAuthenticationSessionErrorCode: { CanceledLogin: 1 },
		ASWebAuthenticationSession: {
			alloc: () => ({
				initWithURLCallbackURLSchemeCompletionHandler(_url, _scheme, fn) {
					if (constructError) {
						throw new Error('native construction failed')
					}
					completion = fn
					return session
				},
			}),
		},
	})

	return {
		auth: exports.authSession,
		app,
		session,
		callback(url, error) {
			completion(url ? { absoluteString: url } : null, error)
		},
		redirect(url) {
			intentUrl = url
			app.android.emit('activityNewIntent', { intent: activity.getIntent() })
		},
	}
}

const open = (h) =>
	h.auth.impl.open('https://example.test/login', {
		callbackScheme: 'sample',
		prefersEphemeralSession: true,
	})

test('Android callback completes once, ignores unrelated links, removes listeners, and permits retry', async () => {
	const h = load()
	const first = open(h)
	assert.equal((await open(h)).type, 'error')
	h.redirect('other://callback')
	assert.ok(h.app.android.count() > 0)
	h.redirect('sample://callback?code=one')
	assert.equal((await first).url, 'sample://callback?code=one')
	assert.equal(h.app.android.count() + h.app.count(), 0)
	const retry = open(h)
	h.redirect('sample://callback?code=two')
	assert.equal((await retry).type, 'success')
})

test('Android resume without a fresh callback cancels instead of replaying a stale activity intent', async () => {
	const h = load({ initialUrl: 'sample://callback?code=old' })
	const pending = open(h)
	h.app.emit('resume')
	assert.equal((await pending).type, 'cancel')
	assert.equal(h.app.android.count() + h.app.count(), 0)
})

test('Android rejected browser launch returns error and releases the active session', async () => {
	const h = load({ launch: () => false })
	const result = await Promise.race([
		open(h),
		new Promise((resolve) => setTimeout(() => resolve({ type: 'pending' }), 30)),
	])

	assert.equal(result.type, 'error')
	assert.equal(h.app.android.count() + h.app.count(), 0)
	assert.match((await open(h)).message, /browser/)
})

test('Android launch exception returns error and releases listeners', async () => {
	const h = load({
		launch: () => {
			throw new Error('no browser')
		},
	})

	assert.equal((await open(h)).type, 'error')
	assert.equal(h.app.android.count() + h.app.count(), 0)
})

test('iOS success, cancel, native error, invalid URL, and failed start have documented results', async () => {
	for (const [url, error, expected] of [
		['sample://callback', null, 'success'],
		[null, { code: 1 }, 'cancel'],
		[null, { code: 2, localizedDescription: 'failed' }, 'error'],
	]) {
		const h = load({ ios: true })
		const pending = open(h)
		assert.equal(h.session.prefersEphemeralWebBrowserSession, true)
		h.callback(url, error)
		assert.equal((await pending).type, expected)
	}

	assert.equal((await open(load({ ios: true, start: () => false }))).type, 'error')
	assert.equal(
		(await load({ ios: true }).auth.impl.open('invalid', { callbackScheme: 'sample' })).type,
		'error',
	)
})

test('iOS construction exception resolves as an error result', async () => {
	const h = load({ ios: true, constructError: true })
	assert.equal((await open(h)).type, 'error')
})

test('web hosted sessions are explicitly unsupported', async () => {
	const exports = {}
	vm.runInNewContext(await compile('auth-session.web'), { exports })
	assert.equal(exports.authSession.supported, false)
	assert.equal(exports.authSession.impl, null)
	assert.equal(await exports.authSession.ensure(), 'unsupported')
})
