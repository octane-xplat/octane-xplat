import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const root = new URL('../src/', import.meta.url)
const files = ['storage', 'storage.web', 'appkit-host', 'storage.macos']

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

	return { api: require(`./${file}`).storage, context }
}

// The native leaf is a thin seam over @nativescript/core: ApplicationSettings
// is the backing store and Application delivers suspend/exit lifecycle.
function nativescript({ flush = () => true } = {}) {
	const flushes = []
	const listeners = new Map()
	const data = new Map()
	const Application = {
		suspendEvent: 'suspend',
		exitEvent: 'exit',
		on: (event, cb) => listeners.set(event, cb),
		off: (event) => listeners.delete(event),
	}

	const ApplicationSettings = {
		getString: (k) => data.get(k),
		setString: (k, v) => data.set(k, v),
		remove: (k) => data.delete(k),
		flush: () => {
			const result = flush()
			flushes.push(result)
			return result
		},
	}

	return {
		import: { '@nativescript/core': { Application, ApplicationSettings } },
		fire: (event) => listeners.get(event)?.(),
		listeners,
		flushes,
		data,
	}
}

test('native flush blocks on the platform store and returns its confirmation', () => {
	const ns = nativescript({ flush: () => true })
	const { api } = load('storage', {}, ns.import)

	api.setString('session', 'token-1')
	assert.equal(api.flush(), true)
	assert.equal(api.flush(), true)
	assert.equal(ns.flushes.length, 2)
})

test('native flush propagates backing-store failure to the caller', () => {
	const failing = nativescript({ flush: () => false })
	const { api } = load('storage', {}, failing.import)
	assert.equal(api.flush(), false)

	const throwing = nativescript({
		flush: () => {
			throw new Error('disk full')
		},
	})

	const { api: api2 } = load('storage', {}, throwing.import)
	assert.throws(() => api2.flush(), /disk full/)
})

test('native suspends and exits flush pending writes; reads see them', () => {
	const ns = nativescript({ flush: () => true })
	const { api } = load('storage', {}, ns.import)

	assert.equal(ns.listeners.has('suspend'), true)
	assert.equal(ns.listeners.has('exit'), true)

	api.setString('session', 'token-2')
	api.remove('stale')
	ns.fire('suspend')
	ns.fire('exit')
	ns.fire('suspend')
	assert.equal(ns.flushes.length, 3)
	assert.equal(api.getString('session'), 'token-2')
})

test('web leaf commits synchronously and flush is a durable no-op', () => {
	const data = new Map()
	const { api } = load('storage.web', {
		localStorage: {
			getItem: (k) => (data.has(k) ? data.get(k) : null),
			setItem: (k, v) => data.set(k, v),
			removeItem: (k) => data.delete(k),
		},
	})

	api.setString('k', 'v')
	assert.equal(api.getString('k'), 'v')
	assert.equal(api.flush(), true)
	assert.equal(api.flush(), true)
	api.remove('k')
	assert.equal(api.getString('k'), null)
})

test('macOS host-backed storage delegates flush and reports its result', () => {
	for (const result of [true, false]) {
		const flushes = []
		const { api, context } = load('storage.macos')
		context.__xplatAppKit = {
			storageGet: (k) => (k === 'k' ? 'v' : null),
			storageSet: () => {},
			storageRemove: () => {},
			storageFlush: () => {
				flushes.push(result)
				return result
			},
		}

		assert.equal(api.getString('k'), 'v')
		assert.equal(api.flush(), result)
		assert.equal(flushes.length, 1)
	}
})

test('macOS synchronous host without a flush hook reports true; Map fallback reports false', () => {
	const withSetOnly = load('storage.macos')
	withSetOnly.context.__xplatAppKit = { storageSet: () => {} }
	withSetOnly.api.setString('k', 'v')
	assert.equal(withSetOnly.api.flush(), true)

	const noHost = load('storage.macos')
	noHost.api.setString('k', 'v')
	assert.equal(noHost.api.getString('k'), 'v')
	assert.equal(noHost.api.flush(), false)
})

test('macOS arms the inactive flush on first write once a durable host exists', () => {
	const state = { flushes: 0, listener: null }
	const { api, context } = load('storage.macos')
	context.__xplatAppKit = {
		appState: 'active',
		storageSet: () => {},
		onAppStateChange: (listener) => {
			state.listener = listener
			return () => {}
		},
	}

	// No storageFlush yet — nothing durable to arm.
	api.setString('k', 'v')
	assert.equal(state.listener, null)

	context.__xplatAppKit.storageFlush = () => {
		state.flushes++
		return true
	}

	api.setString('k2', 'v2')
	assert.equal(typeof state.listener, 'function')

	state.listener()
	assert.equal(state.flushes, 0)
	context.__xplatAppKit.appState = 'inactive'
	state.listener()
	state.listener()
	assert.equal(state.flushes, 2)
})

test('AppKit host storage seam delegates to NSUserDefaults and flush reports synchronize', async () => {
	const source = ts.transpile(
		await readFile(new URL('../../../apps/macos/src/appkit.ts', import.meta.url), 'utf8'),
		{ module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
	)

	const parsed = ts.createSourceFile(
		'appkit.js',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	)

	const install = parsed.statements.find(
		(node) => ts.isFunctionDeclaration(node) && node.name?.text === 'installPlatformServices',
	)

	assert.ok(install)

	const store = new Map()
	let syncResult = true
	const syncs = []
	const context = {
		shared: { running: true, platformServices: { appState: 'active' } },
		app: {},
		NSBundle: { mainBundle: {} },
		NSUserDefaults: {
			standardUserDefaults: {
				stringForKey: (k) => (store.has(k) ? store.get(k) : null),
				setObjectForKey: (v, k) => store.set(k, v),
				removeObjectForKey: (k) => store.delete(k),
				synchronize: () => {
					syncs.push(syncResult)
					return syncResult
				},
			},
		},
		announceAppKit: () => {},
	}

	vm.runInNewContext(install.getText(parsed) + '\ninstallPlatformServices()', context)
	const seam = context.__xplatAppKit
	seam.storageSet('k', 'v')
	assert.equal(seam.storageGet('k'), 'v')
	seam.storageRemove('k')
	assert.equal(seam.storageGet('k'), null)
	seam.storageSet('k2', 'v2')
	assert.equal(seam.storageFlush(), true)
	assert.equal(syncs.length, 1)
	syncResult = false
	assert.equal(seam.storageFlush(), false)
})
