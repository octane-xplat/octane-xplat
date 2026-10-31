import assert from 'node:assert/strict'
import { test } from 'node:test'
import { observeTextViewLayout, retireTextViewLayout } from '../src/text-view-layout.ts'

// Authored JS/native-bridge models only; no AppKit framework or test ran here.
function model() {
	const callbacks: (() => void)[] = [], tokens: object[] = [], removed: object[] = []
	const effects: { add?: () => void; remove?: (token: object) => void } = {}
	const view = {}, clip: any = {}, viewport = { contentView: clip, documentView: view }
	const node: any = { view, textViewport: viewport }
	const center: any = {
		addObserverForNameObjectQueueUsingBlock(name: unknown, target: unknown, queue: unknown, callback: () => void) {
			assert.equal(this, center); assert.equal(name, 'frame'); assert.equal(target, clip); assert.equal(queue, null)
			const token = {}; tokens.push(token); callbacks.push(callback)
			callback() // Registration may invoke a callback before returning its handle.
			effects.add?.()
			return token
		},
		removeObserver(token: object) { assert.equal(this, center); removed.push(token); effects.remove?.(token) },
	}
	const host = { NSNotificationCenter: { defaultCenter: center }, NSViewFrameDidChangeNotification: 'frame' }
	return { node, view, clip, viewport, center, host, callbacks, tokens, removed, effects }
}

test('observation captures its center and cleanup, suppresses setup and retires idempotently', () => {
	const f = model(); let fits = 0
	const stop = observeTextViewLayout(f.node, () => { fits++ }, () => f.host)!
	assert.equal(fits, 0); assert.equal(f.clip.postsFrameChangedNotifications, true)
	f.callbacks[0](); assert.equal(fits, 1)
	f.host.NSNotificationCenter.defaultCenter = {} as any
	f.center.removeObserver = () => { throw Error('replacement remover must not run') }
	stop(); stop(); retireTextViewLayout(f.node); f.callbacks[0]()
	assert.equal(fits, 1); assert.deepEqual(f.removed, f.tokens); assert.equal(f.node.textLayoutDetach, undefined)
})

test('retirement during registration releases the late token and prevents resurrection', () => {
	const f = model(); let fits = 0
	f.effects.add = () => retireTextViewLayout(f.node)
	const stop = observeTextViewLayout(f.node, () => { fits++ }, () => f.host)
	stop?.(); f.callbacks[0]()
	assert.equal(fits, 0); assert.deepEqual(f.removed, f.tokens); assert.equal(f.node.textLayoutDetach, undefined)
	assert.equal(observeTextViewLayout(f.node, () => {}, () => { throw Error('retired host lookup') }), undefined)
	assert.equal(f.tokens.length, 1)
})

test('old cleanup cannot replace a newer observer admitted during replacement', () => {
	const f = model(), fits: string[] = []
	observeTextViewLayout(f.node, () => fits.push('old'), () => f.host)
	let newest: (() => void) | undefined
	f.effects.remove = token => {
		if (token === f.tokens[0]) {newest = observeTextViewLayout(f.node, () => fits.push('new'), () => f.host)}
	}
	const superseded = observeTextViewLayout(f.node, () => fits.push('superseded'), () => f.host)
	assert.equal(f.tokens.length, 2); assert.equal(f.node.textLayoutDetach, newest)
	superseded?.(); f.callbacks[0](); f.callbacks[1]()
	assert.deepEqual(fits, ['new']); assert.equal(f.node.textLayoutDetach, newest)
	retireTextViewLayout(f.node); assert.deepEqual(f.removed, f.tokens)
})

test('a replaced editor, viewport, clip or document ends the old scope without fitting', () => {
	for (const scope of ['view', 'viewport', 'clip', 'document']) {
		const f = model(); let fits = 0
		const stop = observeTextViewLayout(f.node, () => { fits++ }, () => f.host)!
		if (scope === 'view') {f.node.view = {}}
		else if (scope === 'viewport') {f.node.textViewport = {}}
		else if (scope === 'clip') {f.viewport.contentView = {}}
		else {f.viewport.documentView = {}}
		f.callbacks[0](); stop(); f.callbacks[0]()
		assert.equal(fits, 0); assert.equal(f.node.textLayoutDetach, undefined); assert.deepEqual(f.removed, f.tokens)
	}
})

test('missing bridge, flag and acquisition failures clear ownership with fixed errors', () => {
	for (const phase of ['bridge', 'flag', 'add', 'empty']) {
		const f = model()
		if (phase === 'bridge') {f.center.removeObserver = undefined}
		else if (phase === 'flag') {Object.defineProperty(f.clip, 'postsFrameChangedNotifications', { set() { throw Error('private-native-payload') } })}
		else if (phase === 'add') {f.effects.add = () => { throw Error('private-native-payload') }}
		else {f.center.addObserverForNameObjectQueueUsingBlock = () => null}
		assert.throws(() => observeTextViewLayout(f.node, () => {}, () => f.host), { message: 'AppKit TextArea layout observation failed' })
		assert.equal(f.node.textLayoutDetach, undefined)
		for (const callback of f.callbacks) {callback()}
	}
	// A native add which throws without returning a handle cannot be released
	// from JS; this model does not claim that native resource was recovered.
})

test('fit and removal faults retire before reentry and never log native payloads', () => {
	const f = model(), warnings: unknown[][] = [], warn = console.warn
	let fits = 0
	console.warn = (...args) => { warnings.push(args) }
	try {
		f.effects.remove = () => { f.callbacks[0](); throw Error('private-native-payload') }
		observeTextViewLayout(f.node, () => { fits++; throw Error('private-input-payload') }, () => f.host)
		f.callbacks[0](); f.callbacks[0](); retireTextViewLayout(f.node)
		assert.equal(fits, 1); assert.deepEqual(f.removed, f.tokens); assert.equal(f.node.textLayoutDetach, undefined)
		assert.deepEqual(warnings, [['[macos-textarea] Layout observer cleanup failed'], ['[macos-textarea] Layout update failed']])
	} finally { console.warn = warn }
})

test('a scope getter failure after acquisition releases the already returned handle', () => {
	const f = model()
	f.effects.add = () => Object.defineProperty(f.viewport, 'documentView', { get() { throw Error('private-native-payload') } })
	assert.throws(() => observeTextViewLayout(f.node, () => {}, () => f.host), { message: 'AppKit TextArea layout observation failed' })
	assert.deepEqual(f.removed, f.tokens); assert.equal(f.node.textLayoutDetach, undefined)
})
