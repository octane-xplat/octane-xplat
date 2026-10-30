import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Future source execution only; fake producers/router do not prove native hooks.
const source = await readFile(new URL('../../app/src/appkit-route-links.macos.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
	fileName: 'appkit-route-links.macos.ts',
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	transformers: { before: [context => {
		const visit = node => ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword
			? context.factory.createIdentifier('__meta') : ts.visitEachChild(node, visit, context)
		return root => ts.visitNode(root, visit)
	}] },
}).outputText
const tick = async () => { await Promise.resolve(); await Promise.resolve() }
function load({ initial = null, pending = [], navigate = async () => ({ status: 'committed' }), consumeFailure = false,
	subscribeFailure = false, removeFailure = false, onSubscribe } = {}) {
	const listeners = [], calls = [], warnings = [], hot = []
	let consumed = 0, removed = 0
	const context = {
		exports: {}, __meta: { hot: { dispose: callback => hot.push(callback) } },
		console: { warn: message => warnings.push(message) },
		require(name) {
			if (name === '@octane-xplat/platform') {return {
				onDeepLink(listener) {
					listeners.push(listener)
					for (const url of pending) {listener(url)}
					onSubscribe?.(context.exports.bindAppKitRouteLinks)
					if (subscribeFailure) { subscribeFailure = false; throw new Error('subscribe failed') }
					return () => { removed++; listener('xplat://late-cleanup'); if (removeFailure) {throw new Error('cleanup failed')} }
				},
				consumeInitialUrl() {
					if (consumeFailure) { consumeFailure = false; throw new Error('consume failed') }
					consumed++
					return consumed === 1 ? initial : null
				},
			}}
			if (name === '@octane-xplat/ui/routing') {return { router: { navigateUrl(url) { calls.push(url); return navigate(url) } } }}
			throw new Error('Unexpected import')
		},
	}
	vm.runInNewContext(compiled, context)
	return { bind: context.exports.bindAppKitRouteLinks, listeners, calls, warnings, hot, removed: () => removed }
}

test('AppKit route links wait until acquisition returns and forward initial before staged live URLs', async () => {
	const h = load({ initial: 'xplat://launch', pending: ['xplat://queued'] })
	assert.equal(h.listeners.length, 0)
	const stop = h.bind()
	assert.deepEqual(h.calls, [])
	await tick()
	assert.deepEqual(h.calls, ['xplat://launch', 'xplat://queued'])
	h.listeners[0]('xplat://live')
	assert.deepEqual(h.calls, ['xplat://launch', 'xplat://queued', 'xplat://live'])
	stop(); stop()
	assert.equal(h.removed(), 1)
	h.listeners[0]('xplat://held')
	assert.equal(h.calls.length, 3)
})

test('AppKit route cleanup before the first microtask prevents startup navigation', async () => {
	const h = load({ pending: ['xplat://launch'] }), stop = h.bind()
	stop()
	await tick()
	assert.deepEqual(h.calls, [])
	assert.equal(h.warnings.length, 0)
})

test('AppKit route setup failure retires delivered callbacks and remains retryable', async () => {
	for (const failure of [{ subscribeFailure: true }, { consumeFailure: true }]) {
		const h = load({ ...failure, pending: ['xplat://launch'] })
		assert.throws(h.bind, /failed/)
		h.listeners[0]('xplat://held')
		await tick()
		assert.deepEqual(h.calls, [])
		const stop = h.bind()
		await tick()
		assert.deepEqual(h.calls, ['xplat://launch'])
		stop()
	}
})

test('AppKit route rejection/refusal/synchronous throw is contained without exposing URL or error data', async () => {
	const h = load({ navigate(url) {
		if (url.endsWith('reject')) {return Promise.reject(new Error('private error payload'))}
		if (url.endsWith('throw')) {throw new Error('private error payload')}
		if (url.endsWith('blocked')) {return Promise.resolve({ status: 'blocked', error: 'private error payload' })}
		return Promise.resolve({ status: 'committed' })
	} })
	const stop = h.bind(); await tick()
	for (const name of ['reject', 'throw', 'blocked', 'good']) {h.listeners[0](`xplat://${name}`)}
	await tick()
	assert.equal(h.calls.length, 4)
	assert.deepEqual(h.warnings, ['[macos] Incoming link navigation failed', '[macos] Incoming link navigation failed',
		'[macos] Incoming link navigation did not commit'])
	stop()
})

test('AppKit forwards later URLs immediately and leaves overlapping admission/cancellation to the router', async () => {
	const finishes = []
	const h = load({ navigate: () => new Promise(resolve => { finishes.push(resolve) }) }), stop = h.bind()
	await tick()
	h.listeners[0]('xplat://first'); h.listeners[0]('xplat://second')
	assert.deepEqual(h.calls, ['xplat://first', 'xplat://second'])
	stop()
	for (const finish of finishes) {finish({ status: 'blocked' })}
	await tick()
	assert.equal(h.warnings.length, 0)
})

test('AppKit replacement retires old bindings and cleanup failure cannot reactivate them', async () => {
	const h = load({ removeFailure: true }), first = h.bind()
	await tick()
	const next = h.bind()
	first()
	await tick()
	h.listeners[0]('xplat://old'); h.listeners[1]('xplat://next')
	assert.deepEqual(h.calls, ['xplat://next'])
	assert.doesNotThrow(next)
	assert.equal(h.removed(), 2)
	assert.deepEqual(h.warnings, ['[macos] Incoming link cleanup failed', '[macos] Incoming link cleanup failed'])
})

test('AppKit HMR cleanup releases its producer and cancels pending startup delivery', async () => {
	const h = load({ pending: ['xplat://launch'] })
	h.bind()
	h.hot[0](); h.hot[0]()
	await tick()
	assert.equal(h.removed(), 1)
	assert.deepEqual(h.calls, [])
})


test('AppKit reentrant root replacement releases a late producer handle without touching the new owner', async () => {
	let first = true, latest
	const h = load({ onSubscribe(bind) { if (first) { first = false; latest = bind() } } })
	const old = h.bind()
	await tick()
	assert.equal(h.removed(), 1)
	old()
	h.listeners[0]('xplat://old'); h.listeners[1]('xplat://new')
	assert.deepEqual(h.calls, ['xplat://new'])
	latest()
	assert.equal(h.removed(), 2)
})

test('AppKit entry binds in the root effect, forwards props and returns the binding cleanup', async () => {
	const source = await readFile(new URL('../../../apps/macos/src/App.tsx', import.meta.url), 'utf8')
	const compiled = ts.transpileModule(source, { fileName: 'App.tsx', compilerOptions: {
		module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
		jsx: ts.JsxEmit.ReactJSX, jsxImportSource: '@octane-xplat/jsx',
	} }).outputText
	const App = () => null, props = { parentWindow: {}, children: 'content' }
	let effect, bound = 0, removed = 0
	const context = { exports: {}, console: { warn() {} }, require(name) {
		if (name === 'octane') {return { useEffect: callback => { effect = callback } }}
		if (name === '@xplat/app') {return { App }}
		if (name === '@xplat/app/appkit-route-links.macos') {return {
			bindAppKitRouteLinks() { bound++; return () => { removed++ } },
		}}
		if (name.endsWith('jsx-runtime')) {return { jsx: (type, props) => ({ type, props }) }}
		if (name === './styles') {return {}}
		throw new Error('Unexpected import')
	} }
	vm.runInNewContext(compiled, context)
	assert.equal(bound, 0)
	const rendered = context.exports.default(props)
	assert.equal(rendered.type, App)
	assert.equal(rendered.props.parentWindow, props.parentWindow)
	assert.equal(rendered.props.children, 'content')
	assert.equal(bound, 0)
	const stop = effect()
	assert.equal(bound, 1)
	stop()
	assert.equal(removed, 1)
})
