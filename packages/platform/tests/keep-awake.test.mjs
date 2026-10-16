import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const root = new URL('../src/', import.meta.url)
const files = [
	'keep-awake.types',
	'keep-awake-tags',
	'keep-awake',
	'keep-awake.web',
	'keep-awake.macos',
	'keep-awake.windows',
]

const compiled = Object.fromEntries(
	await Promise.all(
		files.map(async (file) => [
			file,
			ts.transpile(await readFile(new URL(`${file}.ts`, root), 'utf8'), {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
			}),
		]),
	),
)

function load(file, globals = {}, imports = {}) {
	const cache = {}
	const context = vm.createContext({ ...globals })
	function require(name) {
		if (name in imports) {
			return imports[name]
		}

		const key = name.replace('./', '')
		if (cache[key]) {
			return cache[key]
		}

		const exports = {}
		cache[key] = exports
		const run = vm.runInContext(`(function(exports, require) {${compiled[key]}\n})`, context)
		run(exports, require)
		return exports
	}

	return { api: require(`./${file}`).keepAwake, module: require(`./${file}`), context }
}

test('macOS tag set deduplicates and retains other owners; failed native calls return false', async () => {
	const begun = [],
		ended = []

	const { api } = load('keep-awake.macos', {
		NSProcessInfo: {
			processInfo: {
				beginActivityWithOptionsReason: (options, tag) => {
					assert.equal(options, 2 ** 40 + 0x00efffff)
					const token = { tag }
					begun.push(token)
					return token
				},
				endActivity: (token) => ended.push(token),
			},
		},
	})

	assert.equal(await api.activate('a'), true)
	await api.activate('a')
	await api.activate('b')
	assert.equal(begun.length, 2)
	await api.deactivate('missing')
	await api.deactivate('a')
	assert.equal(await api.isActivated(), true)
	assert.equal(ended.length, 1)
	await api.deactivate('b')
	assert.equal(await api.isActivated(), false)
	const absent = load('keep-awake.macos').api
	assert.equal(await absent.activate(), false)
	const windows = load('keep-awake.windows').api
	for (const name of ['activate', 'deactivate', 'isAvailable', 'isActivated']) {
		assert.equal(await windows[name](), false)
	}
})

function browser(request, host = false) {
	const events = new Map(),
		sentinels = [],
		calls = []

	const document = {
		visibilityState: 'visible',
		addEventListener: (name, fn) => events.set(name, fn),
		removeEventListener: (name) => events.delete(name),
	}

	const navigator = {
		wakeLock: {
			request: async () => {
				if (request) {
					return request()
				}

				const sentinel = {
					released: false,
					addEventListener: (_, fn) => {
						sentinel.notify = fn
					},
					release: async () => {
						sentinel.released = true
						sentinel.notify()
					},
				}

				sentinels.push(sentinel)
				return sentinel
			},
		},
	}

	const { api } = load(
		'keep-awake.web',
		{ navigator, document },
		{
			'./host-runtime.web': {
				desktopHostSupports: async () => host,
				desktopHostClient: () => ({
					call: async (...args) => {
						calls.push(args)
						return true
					},
				}),
			},
		},
	)

	return { api, events, document, sentinels, calls }
}

test('web deduplicates, reports auto-release and reacquires visible requested tags', async () => {
	const { api, document, events, sentinels } = browser()
	const released = []
	const stop = api.onRelease((tag) => released.push(tag))
	await api.activate('a')
	await api.activate('a')
	await api.activate('b')
	assert.equal(sentinels.length, 2)
	document.visibilityState = 'hidden'
	await sentinels[0].release()
	await sentinels[1].release()
	assert.equal(await api.isActivated(), false)
	assert.deepEqual(released, ['a', 'b'])
	await api.deactivate('a')
	document.visibilityState = 'visible'
	events.get('visibilitychange')()
	assert.equal(await api.isActivated(), true)
	assert.equal(sentinels.length, 3)
	stop()
	await api.deactivate('b')
	await api.deactivate('missing')
	assert.equal(await api.isActivated(), false)
	assert.equal(events.size, 0)
})

test('pending web activation followed by cleanup cannot leak a sentinel', async () => {
	let resolve
	const sentinel = {
		addEventListener: () => {},
		release: async () => {
			sentinel.released = true
		},
	}

	const { api } = browser(
		() =>
			new Promise((done) => {
				resolve = done
			}),
	)

	const activation = api.activate('a')
	const cleanup = api.deactivate('a')
	while (!resolve) {
		await Promise.resolve()
	}

	resolve(sentinel)
	await activation
	await cleanup
	assert.equal(sentinel.released, true)
	assert.equal(await api.isActivated(), false)
})

test('web denied requests return false and can retry; host takes priority', async () => {
	const denied = browser(async () => {
		throw Error('denied')
	})

	assert.equal(await denied.api.activate(), false)
	assert.equal(await denied.api.isActivated(), false)
	await denied.api.deactivate()
	const host = browser(null, true)
	await host.api.activate('a')
	await host.api.activate('a')
	await host.api.deactivate('a')
	assert.equal(host.sentinels.length, 0)
	assert.deepEqual(host.calls, [
		['keepAwake', 'activate', 'a'],
		['keepAwake', 'deactivate', 'a'],
	])
})

function native(ios) {
	const handlers = new Map(),
		activityHandlers = new Map(),
		windows = []

	const makeActivity = () => {
		const window = {
			flags: 0,
			addFlags(value) {
				this.flags |= value
			},
			clearFlags(value) {
				this.flags &= ~value
			},
		}

		windows.push(window)
		return { getWindow: () => window }
	}

	let current = null
	const Application = {
		resumeEvent: 'resume',
		suspendEvent: 'suspend',
		on: (e, f) => handlers.set(e, f),
		off: (e) => handlers.delete(e),
		AndroidApplication: { activityStartedEvent: 'started' },
		android: { on: (e, f) => activityHandlers.set(e, f), off: (e) => activityHandlers.delete(e) },
	}

	const app = { idleTimerDisabled: false }
	const platformAndroid = {
		view: { WindowManager: { LayoutParams: { FLAG_KEEP_SCREEN_ON: 128 } } },
	}

	const platformIOS = { UIApplication: { sharedApplication: app } }
	const { api } = load(
		'keep-awake',
		{
			UIApplication: platformIOS.UIApplication,
			android: platformAndroid,
		},
		{
			'@octane-xplat/platform/android': { android: platformAndroid },
			'@octane-xplat/platform/ios': platformIOS,
			'@nativescript/core': {
				Application,
				isIOS: ios,
				isAndroid: !ios,
				Utils: {
					android: { getCurrentActivity: () => current },
					executeOnMainThread: (fn) => fn(),
				},
			},
		},
	)

	return {
		api,
		app,
		handlers,
		activityHandlers,
		windows,
		makeActivity,
		setCurrent: (activity) => {
			current = activity
		},
	}
}

test('iOS clears in background and reapplies on resume; last tag cleans listeners', async () => {
	const { api, app, handlers } = native(true)
	await api.activate('a')
	await api.activate('b')
	assert.equal(app.idleTimerDisabled, true)
	handlers.get('suspend')()
	assert.equal(app.idleTimerDisabled, false)
	assert.equal(await api.isActivated(), false)
	handlers.get('resume')()
	assert.equal(app.idleTimerDisabled, true)
	await api.deactivate('a')
	assert.equal(app.idleTimerDisabled, true)
	await api.deactivate('b')
	assert.equal(app.idleTimerDisabled, false)
	assert.equal(handlers.size, 0)
})

test('Android defers before first activity, applies to new windows and clears every owned window', async () => {
	const n = native(false)
	assert.equal(await n.api.activate('a'), true)
	assert.equal(await n.api.isActivated(), false)
	const first = n.makeActivity()
	n.setCurrent(first)
	n.activityHandlers.get('started')({ activity: first })
	const second = n.makeActivity()
	n.activityHandlers.get('started')({ activity: second })
	assert.equal(await n.api.isActivated(), true)
	assert.deepEqual(
		n.windows.map((window) => window.flags),
		[128, 128],
	)

	await n.api.deactivate('a')
	assert.deepEqual(
		n.windows.map((window) => window.flags),
		[0, 0],
	)

	assert.equal(n.activityHandlers.size, 0)
})

test('Linux host scopes cookies to webviews, handles zero cookies and releases on close', async () => {
	const source = await readFile(
		new URL('../../cli/src/linux/host/gjs-host.js', import.meta.url),
		'utf8',
	)

	const parsed = ts.createSourceFile(
		'host.js',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	)

	const definitions = ['dispatch', 'releaseKeepAwake']
		.map((name) =>
			parsed.statements
				.find((node) => ts.isFunctionDeclaration(node) && node.name.text === name)
				.getText(parsed),
		)
		.join('\n')

	const cookies = new Map(),
		replies = [],
		calls = [],
		released = []

	let nextCookie = 0
	const context = vm.createContext({
		keepAwakeCookies: cookies,
		hostCapabilities: { keepAwake: ['activate', 'deactivate'] },
		Gtk: { ApplicationInhibitFlags: { IDLE: 8 } },
		app: {
			inhibit: (...args) => {
				calls.push(args)
				return nextCookie
			},
			uninhibit: (cookie) => released.push(cookie),
		},
		receiveProtocol: (_, reply) => replies.push(reply),
	})

	vm.runInContext(definitions, context)
	const a = { get_root: () => 'a' },
		b = { get_root: () => 'b' }

	const dispatch = (wv, method, tag) => context.dispatch(wv, 'id', 'keepAwake', method, [tag], true)
	dispatch(a, 'activate', 'reading')
	assert.equal(replies.at(-1).value, false)
	nextCookie = 11
	dispatch(a, 'activate', 'reading')
	dispatch(a, 'activate', 'reading')
	nextCookie = 12
	dispatch(b, 'activate', 'reading')
	assert.deepEqual(calls, [
		['a', 8, 'reading'],
		['a', 8, 'reading'],
		['b', 8, 'reading'],
	])

	dispatch(a, 'deactivate', 'unknown')
	dispatch(a, 'deactivate', 'reading')
	assert.deepEqual(released, [11])
	assert.equal(cookies.get(b).size, 1)
	context.releaseKeepAwake(b)
	assert.deepEqual(released, [11, 12])
	assert.equal(cookies.has(b), false)
})

test('hook owns a stable generated tag and filters release callbacks before cleanup', async () => {
	const source = await readFile(new URL('use-keep-awake.tsrx', root), 'utf8')
	const compiled = ts.transpile(source, {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

	let effect,
		releaseListener,
		stopped = false

	const calls = [],
		released = [],
		warnings = [],
		exports = {}

	const context = {
		exports,
		console: { warn: (message) => warnings.push(message) },
		require(name) {
			if (name === 'octane') {
				return {
					useId: () => 'generated',
					useEffect: (callback) => {
						effect = callback
					},
				}
			}

			return {
				keepAwake: {
					activate: async (tag) => {
						calls.push(['activate', tag])
						return true
					},
					deactivate: async (tag) => {
						calls.push(['deactivate', tag])
						return false
					},
					onRelease: (listener) => {
						releaseListener = listener
						return () => {
							stopped = true
						}
					},
				},
			}
		},
	}

	vm.runInNewContext(compiled, context)
	exports.useKeepAwake(undefined, {
		onRelease: (tag) => released.push(tag),
		suppressDeactivateWarnings: true,
	})

	const cleanup = effect()
	releaseListener('another')
	releaseListener('generated')
	cleanup()
	await Promise.resolve()
	assert.deepEqual(calls, [
		['activate', 'generated'],
		['deactivate', 'generated'],
	])

	assert.deepEqual(released, ['generated'])
	assert.equal(stopped, true)
	assert.equal(warnings.length, 0)
})

test('macOS desktop windows own independent tags and close cancels late activation', async () => {
	const source = await readFile(
		new URL('../../../apps/macos/src/desktop-webview-host.ts', import.meta.url),
		'utf8',
	)

	const parsed = ts.createSourceFile(
		'host.ts',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	)

	const factory = parsed.statements.find(
		(node) => ts.isFunctionDeclaration(node) && node.name?.text === 'createDesktopWebViewHost',
	)

	const names = ['keepAwakeTags', 'releaseKeepAwake', 'keepAwakeFor']
	const declarations = factory.body.statements
		.filter(
			(node) =>
				ts.isVariableStatement(node) &&
				node.declarationList.declarations.some((declaration) =>
					names.includes(declaration.name.text),
				),
		)
		.map((node) => node.getText(parsed))
		.join('\n')

	const held = new Set(),
		calls = []

	let delayed
	const context = vm.createContext({
		nextKeepAwakeOwner: 0,
		createTaggedKeepAwake: load('keep-awake-tags').module.createTaggedKeepAwake,
		keepAwake: {
			isAvailable: async () => true,
			activate: async (key) => {
				calls.push(key)
				if (delayed) {
					await delayed
				}

				held.add(key)
				return true
			},
			deactivate: async (key) => {
				held.delete(key)
				return true
			},
		},
	})

	const code = ts.transpile(
		declarations +
			'\nglobalThis.hostFor = keepAwakeFor; globalThis.releaseHost = releaseKeepAwake;',
		{ target: ts.ScriptTarget.ES2022 },
	)

	vm.runInContext(code, context)
	const a = {},
		b = {},
		c = {}

	const first = context.hostFor(a),
		second = context.hostFor(b)

	await first.activate('reading')
	await second.activate('reading')
	assert.equal(held.size, 2)
	assert.equal(new Set(calls).size, 2)
	context.releaseHost(a)
	await Promise.resolve()
	assert.equal(held.size, 1)
	await second.deactivate('reading')
	assert.equal(held.size, 0)
	const third = context.hostFor(c)
	let complete
	delayed = new Promise((resolve) => {
		complete = resolve
	})

	const activation = third.activate('late')
	while (calls.length < 3) {
		await Promise.resolve()
	}

	context.releaseHost(c)
	complete()
	assert.equal(await activation, false)
	assert.equal(held.size, 0)
})
