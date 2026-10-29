import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(
		new URL('../src/components/forms/checkbox-control.windows.ts', import.meta.url),
		'utf8',
	),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	let Control
	const checkedDependencyProperty = Symbol('IsCheckedProperty')
	class View {
		isEnabled = true
		initNativeView() {}
		disposeNativeView() {}
	}
	class Property {
		setNative = Symbol('setNative')
		constructor(options) {
			this.options = options
		}
		register(Type) {
			const { name, defaultValue } = this.options
			const value = Symbol(name)
			const setter = this.setNative
			Object.defineProperty(Type.prototype, name, {
				get() {
					return this[value] ?? defaultValue
				},
				set(next) {
					this[value] = next
					if (this.nativeViewProtected) {
						this[setter](next)
					}
				},
			})
		}
	}
	class CheckBox {
		IsEnabled = true
		IsThreeState = false
		MinWidth = 120
		MinHeight = 32
		state = false
		failWrite = false
		nativeCallbacks = 0
		afterWrite
		dependencyWrites = 0
		SetValue(property, value) {
			assert.equal(property, checkedDependencyProperty)
			assert.equal(value, null)
			this.dependencyWrites++
			this.IsChecked = value
		}
		get IsChecked() {
			throw new Error('Nullable Boolean projection must not be read as a JS Boolean')
		}
		set IsChecked(next) {
			if (this.failWrite) {
				throw new Error('native write failed')
			}
			assert.ok(next === null || typeof next === 'boolean')
			assert.ok(next !== null || this.IsThreeState, 'Mixed reporting requires three-state mode')
			if (this.state === next) {
				return
			}
			this.state = next
			const callback = this[next ? 'Checked' : 'Unchecked']
			if (callback) {
				this.nativeCallbacks++
				callback()
			}
			this.afterWrite?.()
		}
	}
	vm.runInNewContext(source, {
		exports: {},
		require(name) {
			if (name === '@nativescript/core') {
				return { View, Property }
			}
			if (name === '@nativescript-community/octane') {
				return {
					registerElement(name, Type) {
						assert.equal(name, 'xplatwindowscheckbox')
						Control = Type
					},
				}
			}
			if (name === '@octane-xplat/platform/windows') {
				return {
					Microsoft: {
						UI: {
							Xaml: {
								Controls: {
									CheckBox,
									Primitives: { ToggleButton: { IsCheckedProperty: checkedDependencyProperty } },
								},
								Markup: { XamlReader: { Load: (template) => template } },
							},
						},
					},
				}
			}
			throw new Error('Unexpected dependency: ' + name)
		},
	})
	const control = new Control()
	const requests = []
	control.requestChange = (next) => requests.push(next)
	const mount = () => {
		const native = control.createNativeView()
		control.nativeViewProtected = native
		control.initNativeView()
		return native
	}
	return { control, requests, mount, native: mount() }
}

test('the native input removes stock minimums and enables three-state reporting only for mixed values', () => {
	const { native, control, requests } = fixture()
	assert.equal(native.MinWidth, 0)
	assert.equal(native.MinHeight, 0)
	assert.equal(native.IsThreeState, false)
	control.checked = 'indeterminate'
	assert.equal(native.IsThreeState, true)
	assert.equal(native.state, null)
	assert.equal(native.dependencyWrites, 1)
	control.checked = true
	assert.equal(native.IsThreeState, false)
	assert.equal(native.state, true)
	control.checked = false
	assert.equal(native.IsThreeState, false)
	assert.deepEqual(requests, [])
})

test('native Checked/Unchecked request booleans while a rejected model stays authoritative', () => {
	const { native, control, requests } = fixture()
	native.IsChecked = true
	assert.deepEqual(requests, [true])
	assert.equal(native.state, false)
	assert.equal(control.checked, false)
	native.IsChecked = true
	assert.deepEqual(requests, [true, true])
})

test('accepted model updates and programmatic prop changes do not echo requests', () => {
	const { native, control, requests } = fixture()
	control.requestChange = (next) => {
		requests.push(next)
		control.checked = next
	}
	native.IsChecked = true
	native.IsChecked = false
	assert.deepEqual(requests, [true, false])
	control.checked = true
	assert.equal(native.state, true)
	control.checked = false
	assert.equal(native.state, false)
	assert.deepEqual(requests, [true, false])
})

test('programmatic writes do not reenter JS through native delegates and restore both subscriptions', () => {
	const { native, control, requests } = fixture()
	const checked = native.Checked
	const unchecked = native.Unchecked
	control.checked = true
	control.checked = false
	assert.equal(native.nativeCallbacks, 0)
	assert.equal(native.Checked, checked)
	assert.equal(native.Unchecked, unchecked)
	native.IsChecked = true
	assert.equal(native.nativeCallbacks, 1)
	assert.deepEqual(requests, [true])
})

test('a view disposed during a prop write never restores retired native subscriptions', () => {
	const { native, control } = fixture()
	native.afterWrite = () => control.disposeNativeView()
	control.checked = true
	assert.equal(native.Checked, null)
	assert.equal(native.Unchecked, null)
})

for (const blockedBy of ['readOnly', 'modelDisabled', 'nativeDisabled']) {
	test(`${blockedBy} rejects a native request and restores the model without a callback`, () => {
		const { native, control, requests } = fixture()
		if (blockedBy === 'readOnly') {
			control.readOnly = true
		}
		if (blockedBy === 'modelDisabled') {
			control.isEnabled = false
		}
		if (blockedBy === 'nativeDisabled') {
			native.IsEnabled = false
		}
		native.IsChecked = true
		assert.equal(native.state, false)
		assert.deepEqual(requests, [])
	})
}

test('a previously checked readonly control also rejects Unchecked', () => {
	const { native, control, requests } = fixture()
	control.checked = true
	control.readOnly = true
	native.IsChecked = false
	assert.equal(native.state, true)
	assert.deepEqual(requests, [])
})

test('callback replacement/removal is observed without rebinding native events', () => {
	const { native, control, requests } = fixture()
	control.requestChange = undefined
	native.IsChecked = true
	control.requestChange = (next) => requests.push(!next)
	native.IsChecked = true
	assert.deepEqual(requests, [false])
})

test('dispose unbinds events and old handlers cannot request changes after native recreation', () => {
	const { native, control, requests, mount } = fixture()
	const late = native.Checked
	control.disposeNativeView()
	assert.equal(native.Checked, null)
	assert.equal(native.Unchecked, null)
	late()
	const replacement = mount()
	late()
	assert.deepEqual(requests, [])
	replacement.IsChecked = true
	assert.deepEqual(requests, [true])
})

test('a failed native write releases the echo guard and preserves the thrown error', () => {
	const { native, control, requests } = fixture()
	native.failWrite = true
	assert.throws(() => {
		control.checked = true
	}, /native write failed/)
	native.failWrite = false
	native.Unchecked()
	assert.deepEqual(requests, [false])
	assert.equal(native.state, true)
})

for (const nativeNext of [true, false]) {
	test(`mixed state requests true after native ${nativeNext ? 'Checked' : 'Unchecked'} and restores a rejected model`, () => {
		const { native, control, requests } = fixture()
		control.checked = 'indeterminate'
		assert.equal(native.state, null)
		native.IsChecked = nativeNext
		assert.deepEqual(requests, [true])
		assert.equal(control.checked, 'indeterminate')
		assert.equal(native.state, null)
	})
}

test('an accepted mixed-state request becomes true without a model-write echo', () => {
	const { native, control, requests } = fixture()
	control.checked = 'indeterminate'
	control.requestChange = (next) => {
		requests.push(next)
		control.checked = next
	}
	native.IsChecked = false
	assert.deepEqual(requests, [true])
	assert.equal(control.checked, true)
	assert.equal(native.state, true)
})

test('readonly mixed state remains mixed after a native request', () => {
	const { native, control, requests } = fixture()
	control.checked = 'indeterminate'
	control.readOnly = true
	native.IsChecked = false
	assert.equal(native.state, null)
	assert.deepEqual(requests, [])
})
