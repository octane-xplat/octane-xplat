import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Actual host methods with fake Foundation registration; this is not ObjC execution.
const hostSource = ts.transpile(await readFile(new URL('../../../apps/macos/src/appkit.ts', import.meta.url), 'utf8'), {
	module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
})
const helperSource = ts.transpile(await readFile(new URL('../../../apps/macos/src/platform-events.ts', import.meta.url), 'utf8'), {
	module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
})
const parsed = ts.createSourceFile('appkit.js', hostSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
const delegate = parsed.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'AppDelegate')
const install = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'installPlatformServices')
assert.ok(delegate); assert.ok(install)
function load(pending = []) {
	const helpers = { exports: {} }
	vm.runInNewContext(helperSource, helpers)
	const services = { appState: 'active', appStateListeners: new Set(), windowResizeListeners: new Set(),
		deepLinkListeners: new Set(), pendingUrls: [...pending] }
	const context = {
		...helpers.exports, shared: { running: true, platformServices: services },
		NSObject: class {}, NSApplicationDelegate: {}, NSWindowDelegate: {}, NativeClass() {},
		NSBundle: { mainBundle: {} }, app: {}, announceAppKit() {},
	}
	vm.runInNewContext(`${delegate.getText(parsed)}\n${install.getText(parsed)}\ninstallPlatformServices(); globalThis.delegate = new AppDelegate()`, context)
	return { delegate: context.delegate, host: context.__xplatAppKit, services }
}

test('AppKit activity commits its current state before isolated native fanout', () => {
	const h = load(), observed = []
	const bad = h.host.onAppStateChange(() => { throw new Error('consumer failed') })
	const good = h.host.onAppStateChange(() => observed.push(h.host.appState))
	assert.doesNotThrow(() => h.delegate.applicationDidResignActive())
	assert.doesNotThrow(() => h.delegate.applicationDidBecomeActive())
	assert.deepEqual(observed, ['inactive', 'active'])
	bad(); good()
})

test('AppKit duplicate callbacks have independent registrations and inert retired handles', () => {
	const h = load()
	let count = 0
	const listener = () => { count++ }
	const first = h.host.onAppStateChange(listener), second = h.host.onAppStateChange(listener)
	const held = [...h.services.appStateListeners][0]
	first(); first(); held()
	h.delegate.applicationDidBecomeActive()
	assert.equal(count, 1)
	assert.equal(h.services.appStateListeners.size, 1)
	second()
	assert.equal(h.services.appStateListeners.size, 0)
})

test('AppKit resize snapshots membership and payload while removed/re-added callbacks wait', () => {
	const h = load(), observed = [], original = {}, replacement = {}
	const notification = { object: original }
	let firstEvent = true, stopSecond
	h.host.onWindowResize(window => {
		assert.equal(window, original)
		observed.push('first')
		if (firstEvent) {
			firstEvent = false
			stopSecond()
			stopSecond = h.host.onWindowResize(second)
			notification.object = replacement
			throw new Error('consumer failed')
		}
	})
	function second(window) { assert.equal(window, original); observed.push('second') }
	stopSecond = h.host.onWindowResize(second)
	h.host.onWindowResize(window => { assert.equal(window, original); observed.push('third') })
	h.delegate.windowDidResize(notification)
	assert.deepEqual(observed, ['first', 'third'])
	notification.object = original
	h.delegate.windowDidResize(notification)
	assert.deepEqual(observed, ['first', 'third', 'first', 'third', 'second'])
	stopSecond()
})

test('AppKit live URL fanout isolates consumers and begins new readers on the next URL', () => {
	const h = load(), observed = []
	let added = false
	h.host.onDeepLink(url => {
		if (!added) { added = true; h.host.onDeepLink(next => observed.push(`new:${next}`)) }
		throw new Error('consumer failed')
	})
	h.host.onDeepLink(url => observed.push(`existing:${url}`))
	assert.doesNotThrow(() => h.delegate.applicationOpenURLs(null, ['xplat://first', 'xplat://second']))
	assert.deepEqual(observed, ['existing:xplat://first', 'existing:xplat://second', 'new:xplat://second'])
})

test('AppKit queues URL launches without readers and consumes each launch once', () => {
	const h = load()
	h.delegate.applicationOpenURLs(null, [{ absoluteString: 'xplat://launch' }, 'xplat://next'])
	assert.equal(h.host.consumeInitialUrl(), 'xplat://launch')
	const observed = []
	const stop = h.host.onDeepLink(url => observed.push(url))
	assert.deepEqual(observed, ['xplat://next'])
	assert.equal(h.host.consumeInitialUrl(), null)
	stop()
	h.delegate.applicationOpenURLs(null, ['xplat://later'])
	assert.equal(h.host.consumeInitialUrl(), 'xplat://later')
})

test('AppKit initial URL-handler failure removes its registration and restores failed/unattempted URLs', () => {
	const h = load(['xplat://first', 'xplat://second'])
	assert.throws(() => h.host.onDeepLink(() => {
		h.services.pendingUrls.push('xplat://newer')
		throw new Error('initial delivery failed')
	}), /initial delivery failed/)
	assert.equal(h.services.deepLinkListeners.size, 0)
	assert.deepEqual(h.services.pendingUrls, ['xplat://first', 'xplat://second', 'xplat://newer'])
	const observed = [], stop = h.host.onDeepLink(url => observed.push(url))
	assert.deepEqual(observed, ['xplat://first', 'xplat://second', 'xplat://newer'])
	stop()
})

test('AppKit retry does not replay pending URLs delivered before a later handler failure', () => {
	const h = load(['xplat://first', 'xplat://second']), observed = []
	assert.throws(() => h.host.onDeepLink(url => {
		if (url === 'xplat://second') throw new Error('second failed')
		observed.push(url)
	}), /second failed/)
	assert.deepEqual(observed, ['xplat://first'])
	const stop = h.host.onDeepLink(url => observed.push(url))
	assert.deepEqual(observed, ['xplat://first', 'xplat://second'])
	assert.equal(h.services.deepLinkListeners.size, 1)
	stop(); stop()
	assert.equal(h.services.deepLinkListeners.size, 0)
})
