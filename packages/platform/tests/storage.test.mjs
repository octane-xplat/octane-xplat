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

test('macOS pending settings cross first host installation without resurrecting removed data', () => {
	const { api, context } = load('storage.macos')
	api.setString('draft', 'local')
	api.remove('obsolete')
	const data = new Map([['obsolete', 'old']])
	context.__xplatAppKit = {
		data,
		storageGet(key) { return this.data.get(key) ?? null },
		storageSet(key, value) { this.data.set(key, value) },
		storageRemove(key) { this.data.delete(key) },
		storageFlush() { return this.data.get('draft') === 'local' },
	}
	assert.equal(api.getString('draft'), 'local')
	assert.equal(api.getString('obsolete'), null)
	assert.equal(data.has('draft'), false) // Reads do not replay writes.
	assert.equal(api.flush(), true)
	assert.equal(data.get('draft'), 'local')
	assert.equal(data.has('obsolete'), false)
	api.remove('draft')
	assert.equal(api.getString('draft'), null)
	delete context.__xplatAppKit
	assert.equal(api.getString('draft'), null)
})

test('macOS missing mutation hooks retain readable intent and refuse flush confirmation', () => {
	const data = new Map([['draft', 'native']])
	const { api, context } = load('storage.macos', {
		__xplatAppKit: { storageGet: (key) => data.get(key) ?? null, storageFlush: () => true },
	})
	api.setString('draft', 'new')
	assert.equal(api.getString('draft'), 'new')
	assert.equal(api.flush(), false)
	context.__xplatAppKit.storageSet = (key, value) => data.set(key, value)
	assert.equal(api.flush(), true)
	api.remove('draft')
	assert.equal(api.getString('draft'), null)
	assert.equal(api.flush(), false)
	assert.equal(data.get('draft'), 'new')
	context.__xplatAppKit.storageRemove = (key) => data.delete(key)
	assert.equal(api.flush(), true)
	assert.equal(data.has('draft'), false)
})

test('macOS native misses invalidate acknowledged mirrors instead of reviving stale settings', () => {
	const { api, context } = load('storage.macos', { __xplatAppKit: { storageSet() {} } })
	api.setString('draft', 'old')
	assert.equal(api.getString('draft'), 'old')
	context.__xplatAppKit.storageGet = () => null
	assert.equal(api.getString('draft'), null)
	delete context.__xplatAppKit.storageGet
	assert.equal(api.getString('draft'), null)
})

test('macOS pending settings remain with their host and failed writes preserve earlier intent', () => {
	const first = {}
	const { api, context } = load('storage.macos', { __xplatAppKit: first })
	api.setString('draft', 'first')
	context.__xplatAppKit = {}
	assert.equal(api.getString('draft'), null)
	api.setString('draft', 'second')
	context.__xplatAppKit = first
	assert.equal(api.getString('draft'), 'first')
	first.storageSet = () => { throw new Error('unavailable') }
	assert.throws(() => api.setString('draft', 'failed'), /unavailable/)
	assert.equal(api.getString('draft'), 'first')
	assert.throws(() => api.flush(), /unavailable/)
	first.storageSet = () => {}
	assert.equal(api.flush(), true)
})

test('macOS bounded flush retains a newer reentrant write for the next handoff', () => {
	const { api, context } = load('storage.macos')
	api.setString('draft', 'first')
	const data = new Map()
	context.__xplatAppKit = {
		storageSet(key, value) {
			data.set(key, value)
			if (value === 'first') {api.setString(key, 'newer')}
		},
		storageGet: (key) => data.get(key) ?? null,
	}
	assert.equal(api.flush(), false)
	assert.equal(data.get('draft'), 'first')
	assert.equal(api.getString('draft'), 'newer')
	assert.equal(api.flush(), true)
	assert.equal(data.get('draft'), 'newer')
})

test('macOS retired lifecycle callbacks cannot flush another host, even if unsubscribe throws', () => {
	const listeners = []
	let removed = 0
	let firstFlushes = 0
	let nextFlushes = 0
	const { api, context } = load('storage.macos', { __xplatAppKit: {
		appState: 'active', storageSet() {}, storageFlush() { firstFlushes++; return true },
		onAppStateChange(listener) {
			listeners.push(listener)
			return () => { removed++; throw new Error('cleanup failed') }
		},
	} })
	api.setString('draft', 'first')
	context.__xplatAppKit = {
		appState: 'active', storageSet() {}, storageFlush() { nextFlushes++; return true },
		onAppStateChange(listener) { listeners.push(listener); return () => {} },
	}
	api.setString('draft', 'next')
	assert.equal(removed, 1)
	listeners[0]()
	assert.equal(firstFlushes, 0)
	assert.equal(nextFlushes, 0)
	context.__xplatAppKit.appState = 'inactive'
	listeners[1]()
	assert.equal(nextFlushes, 1)
	assert.equal(removed, 1)
})

test('macOS retries failed lifecycle registration and binds methods to their host', () => {
	let attempts = 0
	let listener
	const owner = {
		appState: 'active', storageSet() { assert.equal(this, owner) },
		storageFlush() { assert.equal(this, owner); return true },
		onAppStateChange(next) {
			assert.equal(this, owner)
			if (++attempts === 1) {throw new Error('not ready')}
			listener = next
			next() // Synchronous registration callback is safe.
			return () => {}
		},
	}
	const { api } = load('storage.macos', { __xplatAppKit: owner })
	api.setString('draft', 'first')
	api.setString('draft', 'second')
	assert.equal(attempts, 2)
	owner.appState = 'inactive'
	assert.doesNotThrow(() => listener())
	assert.equal(api.flush(), true)
})

test('macOS lifecycle follows replaced hooks and keeps flush errors explicit', () => {
	const listeners = []
	let removed = 0
	const owner = {
		appState: 'active', storageSet() {}, storageFlush: () => true,
		onAppStateChange(listener) { listeners.push(listener); return () => { removed++ } },
	}
	const { api } = load('storage.macos', { __xplatAppKit: owner })
	api.setString('draft', 'first')
	owner.storageFlush = () => { throw new Error('unavailable') }
	api.setString('draft', 'second')
	assert.equal(removed, 1)
	owner.appState = 'inactive'
	assert.doesNotThrow(() => listeners[0]())
	assert.doesNotThrow(() => listeners[1]())
	assert.throws(() => api.flush(), /unavailable/)
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
