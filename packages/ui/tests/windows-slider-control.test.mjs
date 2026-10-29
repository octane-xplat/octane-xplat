import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/slider-control.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	let Control
	const moduleExports = {}
	const owner = {}
	const queued = new Map()
	let nextTask = 0
	let focused = null
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
		setNative = Symbol('setNative')
		constructor(options) {
			this.options = options
		}
		register(Type) {
			const { name, defaultValue, valueChanged } = this.options
			const key = Symbol(name)
			const setter = this.setNative
			Object.defineProperty(Type.prototype, name, {
				get() {
					return this[key] ?? defaultValue
				},
				set(value) {
					const previous = this[key] ?? defaultValue
					this[key] = value
					valueChanged?.(this, previous, value)
					if (this.nativeViewProtected && this[setter]) {
						this[setter](value)
					}
				},
			})
		}
	}
	class NativeSlider {
		min = 0
		max = 100
		value = 0
		IsEnabled = true
		callbacks = 0
		failWrite = false
		focusCalls = []
		XamlRoot = owner
		FocusState = 0
		Focus(state) {
			this.focusCalls.push(state)
			return true
		}
		get Minimum() {
			return this.min
		}
		set Minimum(value) {
			assert.ok(value <= this.max, 'Minimum must not cross Maximum during a prop update')
			this.min = value
			this.Value = Math.max(value, this.value)
		}
		get Maximum() {
			return this.max
		}
		set Maximum(value) {
			assert.ok(value >= this.min, 'Maximum must not cross Minimum during a prop update')
			this.max = value
			this.Value = Math.min(value, this.value)
		}
		get Value() {
			return this.value
		}
		set Value(value) {
			if (this.failWrite) {
				throw new Error('native write failed')
			}
			value = Math.max(this.min, Math.min(this.max, value))
			if (value === this.value) {
				return
			}
			this.value = value
			if (this.ValueChanged) {
				this.callbacks++
				this.ValueChanged()
			}
		}
	}
	vm.runInNewContext(source, {
		exports: moduleExports,
		setTimeout(callback, delay) {
			assert.equal(delay, 0)
			queued.set(++nextTask, callback)
			return nextTask
		},
		clearTimeout(task) {
			queued.delete(task)
		},
		require(name) {
			if (name === '@nativescript/core') {
				return { Property, View }
			}
			if (name === '@nativescript-community/octane') {
				return {
					registerElement(name, Type) {
						assert.equal(name, 'xplatwindowsslider')
						Control = Type
					},
				}
			}
			if (name === '@octane-xplat/platform/windows') {
				return {
					Microsoft: {
						UI: {
							Xaml: {
								FocusState: { Pointer: 1 },
								Input: { FocusManager: { GetFocusedElementWithRoot: () => focused } },
								Controls: { Slider: NativeSlider },
								Markup: { XamlReader: { Load: (template) => template } },
							},
						},
					},
					NSWinRT: {
						asDelegate(name, callback) {
							assert.equal(
								name,
								'Microsoft.UI.Xaml.Controls.Primitives.RangeBaseValueChangedEventHandler',
							)
							return callback
						},
					},
				}
			}
			throw new Error('Unexpected dependency: ' + name)
		},
	})
	const control = new Control()
	control.parent = new View()
	control.parent.nativeViewProtected = { XamlRoot: owner, IsTabStop: false }
	control.parent.children = [control]
	const requests = []
	control.requestChange = (value) => requests.push(value)
	const mount = () => {
		const native = control.createNativeView()
		control.nativeViewProtected = native
		control.initNativeView()
		return native
	}
	const native = mount()
	control.settings = { value: 42, min: 0, max: 100, increment: 1, page: 10, readOnly: false }
	return {
		control,
		native,
		requests,
		mount,
		...moduleExports,
		otherView: (peer) => {
			const other = new View()
			other.nativeViewProtected = peer
			other.parent = control.parent
			control.parent.children.push(other)
			return other
		},
		takeTask: () => {
			const [id, callback] = queued.entries().next().value
			queued.delete(id)
			return callback
		},
		flush: () => {
			for (const [id, callback] of queued) {
				queued.delete(id)
				callback()
			}
		},
		setFocused: (next) => {
			focused = next
		},
	}
}

test('transparent peer keeps native input semantics and restores rejected model writes', () => {
	const { native, requests } = fixture()
	assert.equal(native.IsHitTestVisible, false)
	assert.match(native.Template, /TargetType="Slider"/)
	assert.equal(native.SmallChange, 1)
	assert.equal(native.LargeChange, 10)
	native.Value = 65
	assert.equal(native.Value, 42)
	assert.deepEqual(requests, [65])
	native.Value = 65
	assert.deepEqual(requests, [65, 65])
})

test('accepted changes and fractional prop writes do not echo native requests', () => {
	const { control, native, requests } = fixture()
	control.requestChange = (value) => {
		requests.push(value)
		control.settings = { ...control.settings, value }
	}
	native.Value = 65
	assert.equal(native.Value, 65)
	assert.deepEqual(requests, [65])
	control.settings = { value: 0.375, min: 0, max: 1, increment: 0.01, page: 0.1, readOnly: false }
	assert.equal(native.Value, 0.375)
	assert.equal(native.SmallChange, 0.01)
	assert.equal(native.LargeChange, 0.1)
	assert.deepEqual(requests, [65])
})

test('disjoint bounds updates keep native invariants and suppress coercion callbacks', () => {
	const { control, native, requests } = fixture()
	control.settings = { ...control.settings, min: 200, max: 300, value: 250 }
	assert.equal(native.Minimum, 200)
	assert.equal(native.Maximum, 300)
	assert.equal(native.Value, 250)
	control.settings = { ...control.settings, min: -50, max: -20, value: -30 }
	assert.equal(native.Minimum, -50)
	assert.equal(native.Maximum, -20)
	assert.equal(native.Value, -30)
	assert.equal(native.callbacks, 0)
	assert.deepEqual(requests, [])
})

test('readonly disabled and unloaded peers restore the model without requesting changes', () => {
	for (const block of ['readonly', 'core-disabled', 'native-disabled', 'unloaded']) {
		const { control, native, requests } = fixture()
		if (block === 'readonly') {
			control.settings = { ...control.settings, readOnly: true }
		}

		if (block === 'core-disabled') {
			control.isEnabled = false
		}

		if (block === 'native-disabled') {
			native.IsEnabled = false
		}

		if (block === 'unloaded') {
			control.isLoaded = false
		}

		native.Value = 65
		assert.equal(native.Value, 42)
		assert.deepEqual(requests, [])
	}
})

test('failed native prop writes restore listener ownership and writing depth', () => {
	const { control, native, requests } = fixture()
	native.failWrite = true
	assert.throws(() => {
		control.settings = { ...control.settings, value: 55 }
	}, /native write failed/)
	assert.equal(typeof native.ValueChanged, 'function')
	native.failWrite = false
	control.settings = { ...control.settings, value: 42 }
	native.Value = 65
	assert.deepEqual(requests, [65])
})

test('disposal and replacement leave one handler and ignore retained old callbacks', () => {
	const { control, native, requests, mount } = fixture()
	const stale = native.ValueChanged
	control.disposeNativeView()
	assert.equal(native.ValueChanged, null)
	native.Value = 65
	stale()
	assert.deepEqual(requests, [])
	const replacement = mount()
	stale()
	replacement.Value = 65
	assert.equal(replacement.Value, 42)
	assert.deepEqual(requests, [65])
})

test('pointer focus targets only a loaded enabled peer with the native pointer focus state', () => {
	const { control, native, focusSliderInput } = fixture()
	assert.equal(focusSliderInput(control), true)
	assert.deepEqual(native.focusCalls, [1])
	control.isLoaded = false
	assert.equal(focusSliderInput(control), false)
	control.isLoaded = true
	control.isEnabled = false
	assert.equal(focusSliderInput(control), false)
	control.isEnabled = true
	native.IsEnabled = false
	assert.equal(focusSliderInput(control), false)
	assert.deepEqual(native.focusCalls, [1])
})

test('release focus waits for the native zero-delay task and can be cancelled', () => {
	const f = fixture()
	f.focusSliderInput(f.control)
	f.queueSliderInputFocus(f.control)
	assert.deepEqual(f.native.focusCalls, [1])
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1, 1])
	const cancel = f.queueSliderInputFocus(f.control)
	cancel()
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1, 1])
	const cancelDequeued = f.queueSliderInputFocus(f.control)
	const alreadyDequeued = f.takeTask()
	cancelDequeued()
	alreadyDequeued()
	assert.deepEqual(f.native.focusCalls, [1, 1])
})

test('queued release focus ignores unloaded disabled replaced and reparented peers', () => {
	for (const retire of [
		(f) => {
			f.control.isLoaded = false
		},
		(f) => {
			f.control.isEnabled = false
		},
		(f) => {
			f.native.IsEnabled = false
		},
		(f) => {
			f.control.nativeViewProtected = {}
		},
		(f) => {
			f.native.XamlRoot = {}
		},
	]) {
		const f = fixture()
		f.queueSliderInputFocus(f.control)
		retire(f)
		f.flush()
		assert.deepEqual(f.native.focusCalls, [])
	}
})

test('queued focus preserves a newer target and permits only its own peer or parent', () => {
	const f = fixture()
	f.queueSliderInputFocus(f.control)
	f.setFocused({ XamlRoot: f.native.XamlRoot })
	f.flush()
	assert.deepEqual(f.native.focusCalls, [])
	f.queueSliderInputFocus(f.control)
	f.setFocused(f.control.parent.nativeViewProtected)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1])
	f.queueSliderInputFocus(f.control)
	f.setFocused(f.native)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1, 1])
})

test('a null focus reader falls back to native focus state throughout the same-root view tree', () => {
	const f = fixture()
	const other = f.otherView({ XamlRoot: f.native.XamlRoot, FocusState: 2 })
	f.queueSliderInputFocus(f.control)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [])
	other.nativeViewProtected.FocusState = 0
	f.native.FocusState = 1
	f.control.parent.nativeViewProtected.FocusState = 1
	f.queueSliderInputFocus(f.control)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1])
	other.nativeViewProtected = { XamlRoot: {}, FocusState: 2 }
	f.queueSliderInputFocus(f.control)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [1, 1])
})

test('native focus fallback traverses layouts without Control.FocusState', () => {
	const f = fixture()
	const layout = f.otherView({
		XamlRoot: f.native.XamlRoot,
		get FocusState() {
			throw new Error('not a Control')
		},
	})
	const descendant = f.otherView({ XamlRoot: f.native.XamlRoot, FocusState: 3 })
	f.control.parent.children.pop()
	layout.children = [descendant]
	f.queueSliderInputFocus(f.control)
	f.flush()
	assert.deepEqual(f.native.focusCalls, [])
})
