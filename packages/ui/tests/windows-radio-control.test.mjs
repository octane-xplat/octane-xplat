import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/radio-control.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	let Control
	let ctrl = false
	let focused
	const exports = {}
	const queued = new Map()
	let task = 0
	class View {
		isEnabled = true
		isLoaded = true
		initNativeView() {}
		disposeNativeView() {}
		eachChildView(callback) {
			for (const child of this.children ?? []) {
				if (!callback(child)) {
					break
				}
			}
		}
	}
	class Property {
		constructor(options) {
			this.options = options
		}
		register(Type) {
			const { name, valueChanged } = this.options
			const key = Symbol(name)
			Object.defineProperty(Type.prototype, name, {
				get() {
					return this[key]
				},
				set(value) {
					const previous = this[key]
					this[key] = value
					valueChanged(this, previous, value)
				},
			})
		}
	}
	class NativeRadio {
		IsEnabled = true
		IsTabStop = true
		FocusState = 0
		checked = false
		get IsChecked() {
			return this.checked
		}
		set IsChecked(value) {
			const changed = value !== this.checked
			this.checked = value
			if (changed && value) {
				this.Checked?.()
			}
		}
		Focus(state) {
			if (!this.IsTabStop || !this.IsEnabled) {
				return false
			}
			if (focused) {
				focused.FocusState = 0
				focused.LostFocus?.()
			}
			focused = this
			this.FocusState = state
			return true
		}
	}
	vm.runInNewContext(source, {
		exports,
		setTimeout(callback) {
			queued.set(++task, callback)
			return task
		},
		clearTimeout(id) {
			queued.delete(id)
		},
		require(name) {
			if (name === '@nativescript/core') {
				return { Property, View }
			}
			if (name === '@nativescript-community/octane') {
				return {
					registerElement(name, Type) {
						assert.equal(name, 'xplatwindowsradio')
						Control = Type
					},
				}
			}
			if (name === '@octane-xplat/platform/windows') {
				return {
					Microsoft: {
						UI: {
							Input: { InputKeyboardSource: { GetKeyStateForCurrentThread: () => (ctrl ? 1 : 0) } },
							Xaml: {
								Controls: { RadioButton: NativeRadio },
								FocusState: { Pointer: 1, Keyboard: 2 },
								Markup: { XamlReader: { Load: (value) => value } },
							},
						},
					},
					NSWinRT: { asDelegate: (_name, callback) => callback },
				}
			}
			throw new Error(name)
		},
	})
	const group = new exports.WindowsRadioGroup()
	const requests = []
	group.update('a', false, false, (value) => requests.push(value))
	const root = new View()
	group.root = root
	const controls = ['a', 'b', 'c'].map((value) => {
		const view = new Control()
		view.settings = { group, value }
		view.nativeViewProtected = view.createNativeView()
		view.initNativeView()
		return view
	})
	root.children = controls
	const [a, b, c] = controls
	c.isEnabled = false
	c.peer.IsEnabled = false
	group.restore()
	return {
		group,
		controls,
		a,
		b,
		c,
		requests,
		root,
		queued,
		key(view, key, control = false) {
			ctrl = control
			const args = { Key: key, Handled: false }
			view.peer.PreviewKeyDown(null, args)
			return args
		},
		flush() {
			const callbacks = [...queued.values()]
			queued.clear()
			callbacks.forEach((callback) => callback())
		},
	}
}

test('controlled native selection restores the entire group before requesting', () => {
	const { a, b, group, requests } = fixture()
	b.peer.IsChecked = true
	assert.equal(a.peer.IsChecked, true)
	assert.equal(b.peer.IsChecked, false)
	assert.deepEqual(requests, ['b'])
	assert.equal(group.selected, 'a')
	group.update('b', false, false, (value) => requests.push(value))
	assert.equal(a.peer.IsChecked, false)
	assert.equal(b.peer.IsChecked, true)
	assert.equal(b.peer.IsTabStop, true)
	assert.deepEqual(requests, ['b'])
})

test('selected activation, readonly and disabled requests do not echo', () => {
	const f = fixture()
	f.a.peer.Checked()
	f.group.update('a', false, true, (value) => f.requests.push(value))
	f.b.peer.IsChecked = true
	assert.equal(f.a.peer.IsChecked, true)
	assert.equal(f.b.peer.IsChecked, false)
	f.group.update('a', true, false, (value) => f.requests.push(value))
	f.b.peer.IsChecked = true
	assert.equal(f.b.peer.IsChecked, false)
	assert.deepEqual(f.requests, [])
	assert.ok(f.controls.every((view) => !view.peer.IsTabStop))
})

test('preview arrows follow live model-tree order and skip disabled options', () => {
	const f = fixture()
	f.root.children = [f.b, f.c, f.a]
	f.group.update('b', false, false, (value) => f.requests.push(value))
	f.key(f.b, 40)
	assert.deepEqual(f.requests, ['a'])
	assert.equal(f.a.peer.FocusState, 2)
	assert.equal(f.a.peer.IsTabStop, true)
	f.group.update('a', false, false, (value) => f.requests.push(value))
	f.key(f.a, 40)
	assert.deepEqual(f.requests, ['a'])
})

test('Ctrl-arrow focuses without selection; exiting resets the selected Tab anchor', () => {
	const f = fixture()
	f.key(f.a, 40, true)
	assert.deepEqual(f.requests, [])
	assert.equal(f.b.peer.FocusState, 2)
	assert.equal(f.b.peer.IsTabStop, true)
	f.b.peer.FocusState = 0
	f.b.peer.LostFocus()
	f.flush()
	assert.equal(f.a.peer.IsTabStop, true)
	assert.equal(f.b.peer.IsTabStop, false)
})

test('Home/End clamp and RTL reverses horizontal arrows', () => {
	const f = fixture()
	f.key(f.a, 35)
	assert.deepEqual(f.requests, ['b'])
	f.key(f.b, 36)
	assert.equal(f.a.peer.FocusState, 2)
	f.a.peer.FlowDirection = 1
	f.key(f.a, 37)
	assert.deepEqual(f.requests, ['b', 'b'])
	assert.equal(f.key(f.a, 36, true).Handled, false)
})

test('missing or disabled selected value keeps a live first-enabled Tab stop', () => {
	const f = fixture()
	f.group.update('missing', false, false, () => {})
	assert.equal(f.a.peer.IsTabStop, true)
	f.group.update('c', false, false, () => {})
	assert.equal(f.c.peer.IsChecked, true)
	assert.equal(f.c.peer.IsTabStop, false)
	assert.equal(f.a.peer.IsTabStop, true)
})

test('disposed peers cancel queued focus and reject retired native callbacks', () => {
	const f = fixture()
	const oldNative = f.b.peer
	const checked = oldNative.Checked
	const key = oldNative.PreviewKeyDown
	f.group.queueFocusReset()
	f.b.disposeNativeView()
	assert.equal(f.queued.size, 0)
	assert.equal(oldNative.Checked, null)
	assert.equal(oldNative.PreviewKeyDown, null)
	checked()
	key(null, { Key: 40 })
	assert.deepEqual(f.requests, [])
	assert.equal(f.group.controls.includes(f.b), false)
})
