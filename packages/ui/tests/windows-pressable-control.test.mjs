import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(
		new URL('../src/components/actions/pressable-control.windows.ts', import.meta.url),
		'utf8',
	),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture(tag = 'xplatwindowsbutton') {
	const controls = new Map()
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
	class TextBase extends View {
		constructor(text) {
			super()
			this.text = text
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
	class Button {
		IsEnabled = true
	}
	class HyperlinkButton extends Button {}
	vm.runInNewContext(source, {
		exports: {},
		require(name) {
			if (name === '@nativescript/core') {
				return { Property, TextBase, View }
			}
			if (name === '@nativescript-community/octane') {
				return { registerElement: (tag, Type) => controls.set(tag, Type) }
			}
			if (name === '@octane-xplat/platform/windows') {
				return {
					Microsoft: {
						UI: {
							Xaml: {
								Controls: { Button, HyperlinkButton },
								Markup: { XamlReader: { Load: (xaml) => xaml } },
							},
						},
					},
					NSWinRT: { asDelegate: (_type, callback) => callback },
				}
			}
			throw new Error(name)
		},
	})
	const control = new (controls.get(tag))()
	const root = new View()
	const content = new View()
	const text = new TextBase('First label')
	content.children = [text]
	root.children = [content, control]
	control.parent = root
	const calls = []
	control.settings = { onPress: () => calls.push('first') }
	control.nativeViewProtected = control.createNativeView()
	control.initNativeView()
	return {
		control,
		native: control.nativeViewProtected,
		calls,
		text,
		content,
		Button,
		HyperlinkButton,
	}
}

test('native button and hyperlink retain their WinUI peer under a transparent template', () => {
	for (const [tag, kind] of [
		['xplatwindowsbutton', 'Button'],
		['xplatwindowslink', 'HyperlinkButton'],
	]) {
		const f = fixture(tag)
		assert.equal(f.native.constructor, f[kind])
		assert.match(f.native.Template, new RegExp(`TargetType="${kind}"`))
		assert.equal(f.native.MinWidth, 0)
		assert.equal(f.native.MinHeight, 0)
	}
})

test('one native Click uses the latest callback and removed settings cannot activate', () => {
	const f = fixture()
	f.native.Click()
	f.control.settings = { onPress: () => f.calls.push('updated') }
	f.native.Click()
	f.control.settings = undefined
	f.native.Click()
	assert.deepEqual(f.calls, ['first', 'updated'])
	assert.equal(f.native.IsTabStop, false)
})

test('disabled, detached and disposed peers reject callbacks, including retired delegates', () => {
	const f = fixture()
	const click = f.native.Click
	const layout = f.native.LayoutUpdated
	f.control.isEnabled = false
	click()
	f.control.isEnabled = true
	f.native.IsEnabled = false
	click()
	f.native.IsEnabled = true
	f.control.isLoaded = false
	click()
	f.control.isLoaded = true
	f.control.disposeNativeView()
	click()
	layout()
	assert.deepEqual(f.calls, [])
	assert.equal(f.native.Click, null)
	assert.equal(f.native.LayoutUpdated, null)
	// Recreated native instances must not revive a callback from the old peer.
	f.control.nativeViewProtected = f.control.createNativeView()
	f.control.initNativeView()
	click()
	f.control.nativeViewProtected.Click()
	assert.deepEqual(f.calls, ['first'])
})

test('implicit names follow live nested text and explicit names reset on removal', () => {
	const f = fixture()
	assert.equal(f.control.accessibilityLabel, 'First label')
	f.text.text = 'Updated label'
	f.native.LayoutUpdated()
	assert.equal(f.control.accessibilityLabel, 'Updated label')
	f.control.settings = { label: 'Explicit name' }
	assert.equal(f.control.accessibilityLabel, 'Explicit name')
	f.control.settings = {}
	assert.equal(f.control.accessibilityLabel, 'Updated label')
	f.content.accessible = false
	f.native.LayoutUpdated()
	assert.equal(f.control.accessibilityLabel, '')
})

test('accessibility opt-out is removed from the Tab sequence and resets', () => {
	const f = fixture()
	const onPress = () => {}
	f.control.settings = { accessible: false, onPress }
	assert.equal(f.native.IsTabStop, false)
	f.control.settings = { onPress }
	assert.equal(f.native.IsTabStop, true)
	f.control.settings = {}
	assert.equal(f.native.IsTabStop, false)
})
