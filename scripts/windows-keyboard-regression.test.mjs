import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Installed patched core by default; an isolated extracted candidate may be supplied.
const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))
const core = process.env.WINDOWS_CORE_ARTIFACT
const file = (path) =>
	core ? resolve(core, path) : appRequire.resolve(`@nativescript/core/${path}`)

const pointer = readFileSync(file('ui/gestures/pointer-events.windows.js'), 'utf8').replace(
	/^export /gm,
	'',
)

const keyboard = readFileSync(file('ui/core/view/key-events.windows.js'), 'utf8')
	.replace(/^import .*$/gm, '')
	.replace(/^export /gm, '')

const source = readFileSync(file('ui/core/view/index.windows.js'), 'utf8')
const ast = ts.createSourceFile('view.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
const viewClass = ast.statements.find(
	(node) => ts.isClassDeclaration(node) && node.name?.text === 'View',
)

assert.ok(viewClass, 'Windows View missing')
const methods = new Set([
	'initNativeView',
	'onLoaded',
	'onUnloaded',
	'addEventListener',
	'removeEventListener',
	'_syncKeyEvents',
	'disposeNativeView',
])

const integration = viewClass.members
	.filter((member) => methods.has(member.name?.getText(ast)))
	.map((member) => member.getText(ast))
	.join('\n')

assert.equal(
	viewClass.members.filter((member) => methods.has(member.name?.getText(ast))).length,
	methods.size,
)

const fieldAst = ts.createSourceFile(
	'field.js',
	readFileSync(file('ui/text-field/index.windows.js'), 'utf8'),
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.JS,
)

const fieldClass = fieldAst.statements.find(
	(node) => ts.isClassDeclaration(node) && node.name?.text === 'TextField',
)

const fieldMethods = fieldClass.members
	.filter((member) =>
		['_attachReturnKeyListener', '_detachReturnKeyListener'].includes(
			member.name?.getText(fieldAst),
		),
	)
	.map((member) => member.getText(fieldAst))
	.join('\n')

function fixture() {
	const calls = []
	const context = vm.createContext({
		NSWinRT: {
			asDelegate(type, callback) {
				assert.equal(type, 'Microsoft.UI.Xaml.Input.KeyEventHandler')
				return callback
			},
		},
	})
	const { createWindowsKeyEvents, subscribeNativeEvent, takeWindowsKeyHandled } = vm.runInContext(
		pointer +
			'\n' +
			keyboard +
			'\n({createWindowsKeyEvents,subscribeNativeEvent,takeWindowsKeyHandled});',
		context,
	)
	class Base {
		static layoutChangedEvent = 'layoutChanged'
		isLoaded = false
		isEnabled = true
		handlers = new Map()
		on(name, handler, once = false) {
			this.addEventListener(name, handler, undefined, once)
		}
		off(name, handler) {
			this.removeEventListener(name, handler)
		}
		addEventListener(name, handler, _thisArg, once) {
			const list = this.handlers.get(name) ?? []
			if (!list.some((entry) => entry.handler === handler)) {
				list.push({ handler, once })
			}
			this.handlers.set(name, list)
		}
		removeEventListener(name, handler) {
			this.handlers.set(
				name,
				handler ? (this.handlers.get(name) ?? []).filter((entry) => entry.handler !== handler) : [],
			)
		}
		hasListeners(name) {
			return !!this.handlers.get(name)?.length
		}
		notify(event) {
			for (const entry of (this.handlers.get(event.eventName) ?? []).slice()) {
				entry.handler(event)
				if (entry.once) {
					this.handlers.set(
						event.eventName,
						(this.handlers.get(event.eventName) ?? []).filter((candidate) => candidate !== entry),
					)
				}
			}
		}
		initNativeView() {
			calls.push('init')
		}
		onLoaded() {
			this.isLoaded = true
			calls.push('load')
		}
		onUnloaded() {
			this.isLoaded = false
			calls.push('unload')
		}
		disposeNativeView() {
			calls.push('dispose')
		}
		_syncPercentParent() {}
		_clearPercentParent() {}
		_ensureSizeWatch() {}
	}
	context.ViewCommon = Base
	context.createWindowsKeyEvents = createWindowsKeyEvents
	context.takeWindowsKeyHandled = takeWindowsKeyHandled
	const View = vm.runInContext(
		'class View extends ViewCommon {\n' + integration + '\n}; View;',
		context,
	)
	const view = new View()
	view.nativeViewProtected = { IsEnabled: true }
	context.View = View
	context.TextFieldBase = { returnPressEvent: 'returnPress' }
	context.Windows = { System: { VirtualKey: { Enter: 13 } } }
	const TextField = vm.runInContext(
		'class TextField extends View {\n' + fieldMethods + '\n}; TextField;',
		context,
	)
	return { view, calls, subscribeNativeEvent, TextField }
}

const emit = (native, name = 'KeyDown', args = { Key: 13 }) => native[name]?.(native, args)

test('Windows keys attach lazily, forward raw payload and release each channel independently', () => {
	const { view } = fixture()
	const events = []
	const down = (event) => events.push(event)
	view.on('keyDown', down)
	assert.equal(view.nativeViewProtected.KeyDown, undefined)
	view.onLoaded()
	const native = view.nativeViewProtected
	const args = { Key: 13 }
	emit(native, 'KeyDown', args)
	assert.equal(events.length, 1)
	assert.equal(events[0].nativeEvent, args)
	assert.equal(events[0].object, view)
	const delegate = native.KeyDown
	view.on('keyUp', down)
	const upArgs = { Key: 13 }
	emit(native, 'KeyUp', upArgs)
	assert.equal(events[1].eventName, 'keyUp')
	assert.equal(events[1].nativeEvent, upArgs)
	assert.equal(native.KeyDown, delegate)
	view.off('keyUp', down)
	assert.equal(native.KeyUp, null)
	assert.equal(native.KeyDown, delegate)
	view.off('keyDown', down)
	assert.equal(native.KeyDown, null)
})

test('Windows keys share the text-submit subscriber without replacing it', () => {
	const { view, subscribeNativeEvent } = fixture()
	const native = view.nativeViewProtected
	let submitted = 0,
		keys = 0
	const off = subscribeNativeEvent(
		native,
		'KeyDown',
		() => submitted++,
		null,
		(callback) => callback,
	)
	const submitDelegate = native.KeyDown
	const callback = () => keys++
	view.on('keyDown', callback)
	view.onLoaded()
	assert.equal(native.KeyDown, submitDelegate)
	emit(native)
	assert.equal(keys, 1)
	assert.equal(submitted, 1)
	view.off('keyDown', callback)
	emit(native)
	assert.equal(submitted, 2)
	assert.equal(keys, 1)
	off()
	assert.equal(native.KeyDown, null)
})

test('Windows keys retire stale delegates on unload and rebind on load or native replacement', () => {
	const { view } = fixture()
	let count = 0
	view.on('keyDown', () => count++)
	view.onLoaded()
	const old = view.nativeViewProtected
	const stale = old.KeyDown
	view.onUnloaded()
	stale(old, { Key: 13 })
	assert.equal(count, 0)
	assert.equal(old.KeyDown, null)
	view.onLoaded()
	emit(old)
	assert.equal(count, 1)
	const replacement = { IsEnabled: true }
	view.nativeViewProtected = replacement
	view.initNativeView()
	stale(old, { Key: 13 })
	assert.equal(count, 1)
	assert.equal(old.KeyDown, null)
	emit(replacement)
	assert.equal(count, 2)
	view.disposeNativeView()
	emit(replacement)
	assert.equal(count, 2)
	assert.equal(replacement.KeyDown, null)
})

test('Windows keys suppress model/native disabled targets and stale identities', () => {
	const { view } = fixture()
	let count = 0
	view.on('keyDown', () => count++)
	view.onLoaded()
	const native = view.nativeViewProtected
	view.isEnabled = false
	emit(native)
	view.isEnabled = true
	native.IsEnabled = false
	emit(native)
	native.IsEnabled = true
	emit(native)
	assert.equal(count, 1)
	view.nativeViewProtected = {}
	emit(native)
	assert.equal(count, 1)
})

test('Windows once handlers retire their key channel after Observable removes the listener', () => {
	const { view } = fixture()
	let count = 0
	view.on('keyDown', () => count++, true)
	view.onLoaded()
	const native = view.nativeViewProtected
	emit(native)
	assert.equal(count, 1)
	assert.equal(native.KeyDown, null)
})

test('Windows disposal during dispatch cannot reattach the retiring channel', () => {
	const { view } = fixture()
	view.on('keyDown', () => view.disposeNativeView())
	view.onLoaded()
	const native = view.nativeViewProtected
	emit(native)
	assert.equal(native.KeyDown, null)
})

test('Windows binding failure rolls back newly bound channels and retries without duplicates', () => {
	const { view } = fixture()
	const native = view.nativeViewProtected
	let fail = true,
		up
	Object.defineProperty(native, 'KeyUp', {
		get: () => up,
		set(value) {
			if (fail && value) {
				throw new Error('key up rejected')
			}
			up = value
		},
	})
	view.on('keyDown', () => {})
	view.on('keyUp', () => {})
	assert.throws(() => view.onLoaded(), /key up rejected/)
	assert.equal(native.KeyDown, null)
	fail = false
	view.onLoaded()
	assert.equal(typeof native.KeyDown, 'function')
	assert.equal(typeof native.KeyUp, 'function')
})

test('Windows unload attempts every detach and still forwards base lifecycle after cleanup errors', () => {
	const { view, calls } = fixture()
	const native = view.nativeViewProtected
	let down, up
	Object.defineProperty(native, 'KeyDown', {
		get: () => down,
		set(value) {
			if (value === null) {
				throw new Error('down detach failed')
			}
			down = value
		},
	})
	Object.defineProperty(native, 'KeyUp', {
		get: () => up,
		set(value) {
			up = value
		},
	})
	view.on('keyDown', () => assert.fail('retired delegate fired'))
	view.on('keyUp', () => {})
	view.onLoaded()
	const stale = native.KeyDown
	assert.throws(() => view.onUnloaded(), /Windows key event cleanup failed/)
	assert.equal(view.isLoaded, false)
	assert.ok(calls.includes('unload'))
	assert.equal(up, null)
	stale(native, { Key: 13 })
})

for (const submitFirst of [true, false]) {
	test(`Windows consumed Return suppresses submit with submit-first=${submitFirst}`, () => {
		const { TextField } = fixture()
		const view = new TextField()
		view.nativeViewProtected = { IsEnabled: true }
		view.editable = true
		view.onLoaded()
		let submitted = 0,
			keys = 0
		view.on('returnPress', () => submitted++)
		const consume = (event) => {
			keys++
			event.nativeEvent.Handled = true
		}
		if (submitFirst) {
			view._attachReturnKeyListener()
		}
		view.on('keyDown', consume)
		if (!submitFirst) {
			view._attachReturnKeyListener()
		}
		emit(view.nativeViewProtected, 'KeyDown', { Key: 13, Handled: false })
		assert.equal(keys, 1)
		assert.equal(submitted, 0)
		view.off('keyDown', consume)
		emit(view.nativeViewProtected, 'KeyDown', { Key: 13, Handled: false })
		assert.equal(submitted, 1)
		view._detachReturnKeyListener()
	})
}

test('Windows legacy submit remains unchanged for a prehandled native event without raw consumption', () => {
	const { TextField } = fixture()
	const view = new TextField()
	view.nativeViewProtected = { IsEnabled: true }
	view.editable = true
	view.onLoaded()
	view._attachReturnKeyListener()
	let submitted = 0
	view.on('returnPress', () => submitted++)
	emit(view.nativeViewProtected, 'KeyDown', { Key: 13, Handled: true })
	assert.equal(submitted, 1)
})

test('Windows once key handlers can explicitly consume Return even when native Handled was already set', () => {
	const { TextField } = fixture()
	const view = new TextField()
	view.nativeViewProtected = { IsEnabled: true }
	view.editable = true
	view.onLoaded()
	view._attachReturnKeyListener()
	let submitted = 0
	view.on('returnPress', () => submitted++)
	view.on('keyDown', (event) => event.preventDefault(), true)
	const args = { Key: 13, Handled: true }
	emit(view.nativeViewProtected, 'KeyDown', args)
	assert.equal(submitted, 0)
	args.Handled = false
	emit(view.nativeViewProtected, 'KeyDown', args)
	assert.equal(submitted, 1)
})
