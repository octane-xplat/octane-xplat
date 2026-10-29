import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Future source models; no Octane compiler, native window or OS event is exercised.
const files = ['appkit-state.macos.ts', 'screen.macos.tsrx', 'lifecycle.macos.tsrx',
	'safe-area.macos.tsrx', 'breakpoints.macos.tsrx', 'index.macos.ts']
const compiled = Object.fromEntries(await Promise.all(files.map(async file => [file, ts.transpile(
	await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)])))
const plain = value => JSON.parse(JSON.stringify(value))
function load(owner) {
	const context = vm.createContext({ __xplatAppKit: owner }), cache = {}
	function require(name) {
		if (name === 'octane') return { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() }
		const base = name.replace('./', ''), file = files.find(file => file.replace(/\.(ts|tsrx)$/, '') === base)
		if (!file) return {}
		if (!cache[file]) {
			const exports = cache[file] = {}
			vm.runInContext(`(function(exports, require) {${compiled[file]}\n})`, context)(exports, require)
		}
		return cache[file]
	}
	return { context, require, ...require('./appkit-state.macos') }
}
function owner() {
	const windows = new Set(), activity = new Set()
	const host = {
		appState: 'active', windowSize: { width: 800, height: 600, orientation: 'landscape' },
		onWindowResize(listener) { assert.equal(this, host); windows.add(listener); return () => windows.delete(listener) },
		onAppStateChange(listener) { assert.equal(this, host); activity.add(listener); return () => activity.delete(listener) },
	}
	return { host, windows, activity }
}

test('AppKit window snapshots are stable, detached immutable values and track in-place native changes', () => {
	const { host } = owner(), h = load(host), source = h.appKitWindowSource()
	assert.equal(h.appKitWindowSource(), source)
	const first = source.getSnapshot()
	assert.equal(source.getSnapshot(), first)
	assert.notEqual(first, host.windowSize)
	assert.equal(Object.isFrozen(first), true)
	host.windowSize.width = 400
	const next = source.getSnapshot()
	assert.notEqual(first, next)
	assert.deepEqual(plain(next), { width: 400, height: 600, orientation: 'portrait' })
	assert.equal(first.width, 800)
	assert.equal(source.getSnapshot(), next)
})

test('AppKit invalid or throwing size reads retain a stable zero fallback and recover', () => {
	const { host } = owner(), h = load(host), source = h.appKitWindowSource()
	for (const width of [-1, NaN, Infinity, '800']) {
		host.windowSize = { width, height: 600, orientation: 'landscape' }
		assert.deepEqual(plain(source.getSnapshot()), { width: 0, height: 0, orientation: 'landscape' })
	}
	Object.defineProperty(host, 'windowSize', { configurable: true, get() { throw new Error('unavailable') } })
	const missing = source.getSnapshot()
	assert.equal(source.getSnapshot(), missing)
	Object.defineProperty(host, 'windowSize', { value: { width: 300, height: 600 }, configurable: true })
	assert.equal(source.getSnapshot().width, 300)
})

test('AppKit activity stays live, validates the vocabulary and preserves existing missing-host defaults', () => {
	const { host } = owner(), h = load(host), source = h.appKitActivitySource()
	for (const state of ['active', 'inactive', 'background']) {
		host.appState = state
		assert.equal(source.getSnapshot(), state)
	}
	host.appState = 'invalid'
	assert.equal(source.getSnapshot(), 'active')
	delete h.context.__xplatAppKit
	assert.equal(source.getSnapshot(), 'active')
	assert.equal(h.appKitActivitySource().getSnapshot(), 'active')
	assert.deepEqual(plain(h.appKitWindowSource().getSnapshot()), { width: 0, height: 0, orientation: 'landscape' })
})

test('AppKit duplicate readers own independent subscriptions and method receivers', () => {
	const { host, windows } = owner(), h = load(host), source = h.appKitWindowSource()
	let calls = 0
	const listener = () => { calls++ }
	const first = source.subscribe(listener), second = source.subscribe(listener)
	assert.equal(windows.size, 2)
	for (const notify of [...windows]) notify()
	assert.equal(calls, 2)
	first(); first()
	assert.equal(windows.size, 1)
	for (const notify of [...windows]) notify()
	assert.equal(calls, 3)
	second()
	assert.equal(windows.size, 0)
})

test('AppKit native callback and cleanup failures cannot revive readers or block a sibling', () => {
	const { host, windows } = owner()
	host.onWindowResize = listener => { windows.add(listener); return () => { throw new Error('cleanup failed') } }
	const h = load(host), source = h.appKitWindowSource()
	let calls = 0
	const first = source.subscribe(() => { throw new Error('reader failed') })
	const second = source.subscribe(() => { calls++ })
	for (const notify of [...windows]) assert.doesNotThrow(notify)
	assert.equal(calls, 1)
	assert.doesNotThrow(first); assert.doesNotThrow(second)
	for (const notify of [...windows]) notify()
	assert.equal(calls, 1)
})

test('AppKit registration failure retires held callbacks and a later store selection retries', () => {
	const { host } = owner()
	let failing = true, held, removed = 0
	host.onAppStateChange = listener => {
		held = listener
		listener()
		if (failing) throw new Error('not ready')
		return () => { removed++ }
	}
	const h = load(host), failed = h.appKitActivitySource()
	let calls = 0
	assert.throws(() => failed.subscribe(() => { calls++ }), /not ready/)
	held()
	assert.equal(calls, 0)
	failing = false
	const next = h.appKitActivitySource()
	assert.notEqual(next, failed)
	const stop = next.subscribe(() => { calls++ })
	assert.equal(calls, 1)
	stop(); held()
	assert.equal(calls, 1)
	assert.equal(removed, 1)
})

test('AppKit host/hook replacement selects a new store and ignores former callbacks', () => {
	const first = owner(), next = owner(), h = load(first.host)
	const old = h.appKitWindowSource()
	let calls = 0
	const off = old.subscribe(() => { calls++ })
	const held = [...first.windows][0]
	h.context.__xplatAppKit = next.host
	held()
	assert.equal(calls, 0)
	assert.equal(old.getSnapshot().width, 0)
	const source = h.appKitWindowSource()
	assert.notEqual(source, old)
	next.host.onWindowResize = () => () => {}
	assert.notEqual(h.appKitWindowSource(), source)
	off()
	assert.equal(first.windows.size, 0)
})

test('AppKit root and purpose hooks use identical implementations and neutral desktop contracts', () => {
	const { host } = owner(), h = load(host), root = h.require('./index.macos')
	for (const [module, names] of [['screen', ['useWindowSize']], ['lifecycle', ['useAppState', 'useBackHandler']],
		['safe-area', ['useSafeAreaInsets']], ['breakpoints', ['useBreakpoints$']]]) {
		for (const name of names) assert.equal(root[name], h.require(`./${module}.macos`)[name])
	}
	assert.equal(root.useWindowSize().width, 800)
	assert.equal(root.useAppState(), 'active')
	assert.deepEqual(plain(root.useBreakpoints$({ compact: 0, wide: 900 })), { compact: true, wide: false })
	assert.deepEqual(plain(root.useSafeAreaInsets()), { top: 0, right: 0, bottom: 0, left: 0 })
	assert.equal(root.useBackHandler(() => { throw new Error('no Android back on AppKit') }), undefined)
})
