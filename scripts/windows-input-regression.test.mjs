import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))
const sourceRoot = process.env.WINDOWS_CORE_SOURCE
function load(path, context, exports) {
	const file = sourceRoot
		? resolve(sourceRoot, path.replace(/\.js$/, '.ts'))
		: appRequire.resolve(`@nativescript/core/${path}`)

	let source = readFileSync(file, 'utf8')
	if (sourceRoot) {
		source = ts.transpileModule(source, {
			compilerOptions: {
				target: ts.ScriptTarget.ES2022,
				module: ts.ModuleKind.ESNext,
				experimentalDecorators: true,
			},
		}).outputText
	}

	source = source
		.replace(/^import[\s\S]*?;\n/gm, '')
		.replace(/^export \*[^\n]*\n/gm, '')
		.replace(/^export /gm, '')

	return vm.runInNewContext(`(() => {${source}\nreturn {${exports}}})()`, context)
}

const props = Object.fromEntries(
	[
		'text',
		'keyboardType',
		'returnKeyType',
		'editable',
		'autofillType',
		'autocapitalizationType',
		'autocorrect',
		'hint',
		'placeholderColor',
		'maxLength',
		'secure',
		'color',
		'isEnabled',
		'accessibilityLabel',
	].map((name) => [
		name + 'Property',
		{
			setNative: Symbol(name),
			getDefault: Symbol(name + 'Default'),
			nativeValueChange(owner, value) {
				owner.text = value
				owner.changes.push(value)
			},
		},
	]),
)

const resetSymbol = Symbol('reset')
function setup() {
	class Common {
		isLoaded = true
		isEnabled = true
		editable = true
		text = 'seed'
		events = []
		changes = []
		static returnPressEvent = 'returnPress'
		static focusEvent = 'focus'
		static blurEvent = 'blur'
		initNativeView() {}
		disposeNativeView() {}
		onLoaded() {
			this.isLoaded = true
		}
		onUnloaded() {
			this.isLoaded = false
		}
		focus() {
			return undefined
		}
		notify(e) {
			this.events.push(e.eventName)
		}
		_setNativeText() {
			this.nativeViewProtected[
				this.nativeViewProtected.Password === undefined ? 'Text' : 'Password'
			] = this.text
		}
		setNativeView(value) {
			this.nativeViewProtected = value
			this.initNativeView()
			this[props.editableProperty.setNative](this.editable)
			value.IsEnabled = this.isEnabled && !(value.Password !== undefined && !this.editable)
		}
	}

	class TextBox {
		Text = ''
		IsReadOnly = false
		IsEnabled = true
		FocusState = 0
		Focus() {
			if (!this.IsEnabled) {
				return false
			}

			this.FocusState = 1
			this.GotFocus?.(this, {})
			return true
		}
	}

	class PasswordBox extends TextBox {
		constructor() {
			super()
			delete this.Text
			delete this.IsReadOnly
			this.Password = ''
		}
	}

	const context = {
		...props,
		resetSymbol,
		EditableTextBaseCommon: Common,
		Color: class {},
		WeakRef,
		console,
		NSWinRT: { asDelegate: (_, fn) => fn },
		Windows: { System: { VirtualKey: { Enter: 13 } } },
		Microsoft: {
			UI: {
				Xaml: {
					Controls: { TextBox, PasswordBox },
					FocusState: { Programmatic: 1, Unfocused: 0 },
					UIElement: {},
					Automation: {
						AutomationProperties: {
							SetName: (view, value) => {
								view.Name = value
							},
						},
					},
				},
			},
		},
	}

	const helper = load('ui/gestures/pointer-events.windows.js', context, 'subscribeNativeEvent')
	Object.assign(context, helper)
	const { EditableTextBase } = load(
		'ui/editable-text-base/index.windows.js',
		context,
		'EditableTextBase',
	)

	context.TextFieldBase = EditableTextBase
	context.nativeChildIndex = (children, view) => children.items.indexOf(view)
	const { TextField } = load('ui/text-field/index.windows.js', context, 'TextField')
	const field = new TextField()
	field.nativeViewProtected = new TextBox()
	field.initNativeView()
	context.TextViewBase = EditableTextBase
	const { TextView } = load('ui/text-view/index.windows.js', context, 'TextView')
	return { field, context, TextBox, PasswordBox, TextView }
}

test('public focus reaches native Focus and returns its result', () => {
	const { field } = setup()
	assert.equal(field.focus(), true)
	assert.equal(field.nativeViewProtected.FocusState, 1)
	field.nativeViewProtected.IsEnabled = false
	assert.equal(field.focus(), false)
})

test('native focus transitions forward once and retired delegates are inert', () => {
	const { field } = setup()
	const old = field.nativeViewProtected
	assert.equal(typeof old.GotFocus, 'function')
	old.GotFocus(old, {})
	old.GotFocus(old, {})
	assert.deepEqual([...field.events], ['focus'])
	const late = old.GotFocus
	field.onUnloaded()
	assert.deepEqual([...field.events], ['focus', 'blur'])
	late(old, {})
	assert.equal(field.events.length, 2)
	assert.equal(old.GotFocus, null)
	field.onLoaded()
	old.GotFocus(old, {})
	old.LostFocus(old, {})
	assert.deepEqual([...field.events], ['focus', 'blur', 'focus', 'blur'])
})

test('blur preserves disabled state', () => {
	const { field } = setup()
	field.nativeViewProtected.IsEnabled = false
	field.dismissSoftInput()
	assert.equal(field.nativeViewProtected.IsEnabled, false)
})

test('secure readonly fails closed and becomes editable again', () => {
	const { field, PasswordBox } = setup()
	field.nativeViewProtected = new PasswordBox()
	field.editable = false
	field[props.editableProperty.setNative](false)
	assert.equal(field.nativeViewProtected.IsEnabled, false)
	field.editable = true
	field[props.editableProperty.setNative](true)
	assert.equal(field.nativeViewProtected.IsEnabled, true)
})

test('secure swap detaches old events and reapplies state', () => {
	const { field } = setup()
	const old = field.nativeViewProtected
	const lateText = old.TextChanged
	const lateKey = old.KeyDown
	field.editable = false
	field[props.secureProperty.setNative](true)
	assert.equal(old.TextChanged, null)
	assert.equal(old.KeyDown, null)
	assert.equal(field.nativeViewProtected.IsEnabled, false)
	lateText({ Text: 'retired' }, {})
	lateKey(old, { Key: 13 })
	assert.equal(field.text, 'seed')
	assert.deepEqual([...field.events], [])
})

function loadPropertyClasses() {
	const file = sourceRoot
		? resolve(sourceRoot, 'ui/core/properties/index.ts')
		: appRequire.resolve('@nativescript/core/ui/core/properties/index.js')

	let source = readFileSync(file, 'utf8')
	if (sourceRoot) {
		source = ts.transpileModule(source, {
			compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
		}).outputText
	}

	const start = source.indexOf('class Property')
	const end = source.indexOf('class CssAnimationProperty')
	const shared = load(
		'ui/core/properties/property-shared.js',
		{},
		'unsetValue,isResetValue,isCssWideKeyword',
	)

	const context = {
		...shared,
		symbolPropertyMap: {},
		cssSymbolPropertyMap: {},
		cssPropertyNames: [],
		cssValueSourceKeys: {},
		inheritableProperties: [],
		ValueSource: { Default: 0, Inherited: 1, Css: 2, Local: 3 },
		WrappedValue: { unwrap: (value) => value.wrapped },
	}

	return {
		...shared,
		...vm.runInNewContext(
			source.slice(start, end).replace(/^export /gm, '') +
				'\n({Property,CoercibleProperty,InheritedProperty,CssProperty})',
			context,
		),
	}
}

test('ordinary, coerced and inherited property keywords are literal; sentinel still resets', () => {
	const { Property, CoercibleProperty, InheritedProperty, unsetValue, isCssWideKeyword } =
		loadPropertyClasses()

	for (const Type of [Property, CoercibleProperty, InheritedProperty]) {
		const property = new Type({
			name: 'text',
			defaultValue: 'default',
			coerceValue: (_owner, value) => value,
		})

		const owner = { hasListeners: () => false, eachChild: () => {}, parent: null }
		for (const word of ['initial', 'inherit', 'unset', 'revert']) {
			property.set.call(owner, word)
			assert.equal(property.get.call(owner), word)
			assert.equal(isCssWideKeyword(word), true)
		}

		property.set.call(owner, unsetValue)
		assert.equal(property.get.call(owner), 'default')
	}
})

test('multiline preserves editing, readonly and focus lifecycle', () => {
	const { TextView, TextBox } = setup()
	const area = new TextView()
	area.nativeViewProtected = new TextBox()
	area.initNativeView()
	area.nativeViewProtected.TextChanged({ Text: 'line1\nline2' }, {})
	assert.equal(area.text, 'line1\nline2')
	area.editable = false
	area[props.editableProperty.setNative](false)
	assert.equal(area.nativeViewProtected.IsReadOnly, true)
	assert.equal(area.focus(), true)
	area.nativeViewProtected.LostFocus(area.nativeViewProtected, {})
	assert.deepEqual([...area.events], ['focus', 'blur'])
})

test('input and submit are delivered only for active editable native controls', () => {
	const { field } = setup()
	field.nativeViewProtected.TextChanged({ Text: 'abc' }, {})
	assert.equal(field.text, 'abc')
	field.nativeViewProtected.KeyDown(field.nativeViewProtected, { Key: 13 })
	assert.deepEqual([...field.events], ['returnPress'])
	field.isEnabled = false
	field[props.isEnabledProperty.setNative](false)
	field.nativeViewProtected.KeyDown(field.nativeViewProtected, { Key: 13 })
	assert.equal(field.events.length, 1)
	field.isEnabled = true
	field[props.isEnabledProperty.setNative](true)
	assert.equal(field.nativeViewProtected.IsEnabled, true)
	field.onUnloaded()
	assert.equal(field.nativeViewProtected.KeyDown, null)
	field.onLoaded()
	field.nativeViewProtected.KeyDown(field.nativeViewProtected, { Key: 13 })
	assert.equal(field.events.length, 2)
})

function extract(path, name, context, members) {
	const file = sourceRoot
		? resolve(sourceRoot, path.replace(/\.js$/, '.ts'))
		: appRequire.resolve(`@nativescript/core/${path}`)

	const source = readFileSync(file, 'utf8')
	const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
	const node = ast.statements.find((node) => node.name?.text === name)
	assert.ok(node, `Missing ${name}`)
	const snippet = members
		? `class Selected {${node.members
				.filter((member) => members.some((name) => member.name?.getText(ast).includes(name)))
				.map((member) => member.getText(ast))
				.join('\n')}}`
		: node.getText(ast)

	const compiled = ts
		.transpileModule(snippet, {
			compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
		})
		.outputText.replace(/^export /gm, '')

	return vm.runInNewContext(
		`(() => {${compiled}; return ${members ? 'Selected' : name}})()`,
		context,
	)
}

test('owning View forwards disabled and explicit accessible names including reset and replacement', () => {
	const { context, TextBox } = setup()
	const update = extract(
		'application/application.windows.js',
		'updateAccessibilityProperties',
		context,
	)

	context.updateA11yPropertiesCallback = update
	const View = extract('ui/core/view/index.windows.js', 'View', context, [
		'isEnabledProperty',
		'accessibilityLabelProperty',
	])

	const view = new View()
	view.nativeViewProtected = new TextBox()
	view[props.isEnabledProperty.setNative](false)
	assert.equal(view.nativeViewProtected.IsEnabled, false)
	view[props.isEnabledProperty.setNative](true)
	assert.equal(view.nativeViewProtected.IsEnabled, true)
	view.accessibilityLabel = 'Explicit name'
	view[props.accessibilityLabelProperty.setNative](view.accessibilityLabel)
	assert.equal(view.nativeViewProtected.Name, 'Explicit name')
	view.nativeViewProtected = new TextBox()
	view[props.accessibilityLabelProperty.setNative](view.accessibilityLabel)
	assert.equal(view.nativeViewProtected.Name, 'Explicit name')
	view.accessibilityLabel = undefined
	view[props.accessibilityLabelProperty.setNative](undefined)
	assert.equal(view.nativeViewProtected.Name, '')
})

test('CSS-wide keywords still reset both local and cascade style values', () => {
	const { CssProperty, unsetValue } = loadPropertyClasses()
	class Style {}
	const property = new CssProperty({
		name: 'testStyle',
		cssName: 'test-style',
		defaultValue: 'default',
	})

	property.register(Style)
	const style = new Style()
	style.viewRef = { get: () => ({}) }
	style.hasListeners = () => false
	for (const keyword of ['initial', 'inherit', 'unset', 'revert', unsetValue]) {
		style.testStyle = 'local'
		style.testStyle = keyword
		assert.equal(style.testStyle, 'default')
		style['css:test-style'] = 'cascade'
		assert.equal(style.testStyle, 'cascade')
		style['css:test-style'] = keyword
		assert.equal(style.testStyle, 'default')
	}
})

test('isolated blur emits once and honors a disabled change made by its callback', () => {
	const { field } = setup()
	const native = field.nativeViewProtected
	let enabled = true
	Object.defineProperty(native, 'IsEnabled', {
		get: () => enabled,
		set(value) {
			enabled = value
			if (!value && native.FocusState !== 0) {
				native.FocusState = 0
				native.LostFocus?.(native, {})
			}
		},
	})

	field.focus()
	field.notify = (event) => {
		field.events.push(event.eventName)
		if (event.eventName === 'blur') {
			field.isEnabled = false
			field[props.isEnabledProperty.setNative](false)
		}
	}

	field.dismissSoftInput()
	assert.equal(native.FocusState, 0)
	assert.equal(native.IsEnabled, false)
	assert.deepEqual([...field.events], ['focus', 'blur'])
})

test('native identity replacement and disposal retire text/focus/submit delegates', () => {
	const { field, TextBox } = setup()
	const old = field.nativeViewProtected
	const oldFocus = old.GotFocus
	const oldText = old.TextChanged
	const oldKey = old.KeyDown
	const next = new TextBox()
	field.setNativeView(next)
	assert.equal(old.GotFocus, null)
	assert.equal(old.TextChanged, null)
	assert.equal(old.KeyDown, null)
	oldFocus(old, {})
	oldText({ Text: 'retired' }, {})
	oldKey(old, { Key: 13 })
	assert.equal(field.text, 'seed')
	assert.deepEqual([...field.events], [])
	next.GotFocus(next, {})
	field.disposeNativeView()
	assert.equal(next.GotFocus, null)
	assert.equal(next.TextChanged, null)
	assert.equal(next.KeyDown, null)
	assert.deepEqual([...field.events], ['focus', 'blur'])
})

test('secure readonly and disabled are independent across every restoration order', () => {
	const { field, PasswordBox } = setup()
	field.setNativeView(new PasswordBox())
	for (const [enabled, editable] of [
		[true, false],
		[false, false],
		[false, true],
		[true, true],
		[false, true],
		[false, false],
		[true, false],
		[true, true],
	]) {
		field.isEnabled = enabled
		field.editable = editable
		field[props.isEnabledProperty.setNative](enabled)
		field[props.editableProperty.setNative](editable)
		assert.equal(field.nativeViewProtected.IsEnabled, enabled && editable)
	}
})
