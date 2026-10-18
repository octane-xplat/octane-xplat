import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the text-control paths without loading the Objective-C bridge.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const slice = (startMarker, endMarker) =>
	source.slice(source.indexOf(startMarker), source.indexOf(endMarker))

const makeTextField = slice('function makeTextField(', '\nfunction makeSwitch')
const targetClass = slice('class ButtonActionTarget', 'const buttonActionTarget')
const propApplication = slice('function setControlAction(', '\nfunction detach(')

class FakeTextField {
	static alloc() {
		return new this()
	}
	initWithFrame() {
		return this
	}
}

class FakeSecureTextField extends FakeTextField {}
class FakeTextView extends FakeTextField {
	constructor() {
		super()
		this.textContainer = { lineFragmentPadding: 0 }
	}
}

function makeFieldView() {
	const calls = []
	return {
		calls,
		setAccessibilityLabel(value) {
			calls.push(['setAccessibilityLabel', value])
		},
		setAccessibilityHint(value) {
			calls.push(['setAccessibilityHint', value])
		},
		setAccessibilityElement(value) {
			calls.push(['setAccessibilityElement', value])
		},
		setAccessibilityEnabled(value) {
			calls.push(['setAccessibilityEnabled', value])
		},
	}
}

function textNode(type, extra = {}) {
	return {
		id: 1,
		type,
		view: makeFieldView(),
		props: {},
		parent: null,
		container: { root: { eventScope: (_scope, fn) => fn() } },
		actionId: 7,
		secure: false,
		...extra,
	}
}

test('text fields retain a secure-capable host and their initial values', () => {
	const { makeTextField: make } = runInNewContext(makeTextField + '\n({ makeTextField })', {
		InteractionTextView: FakeTextView,
		ContentAlignedTextField: FakeSecureTextField,
		ContentAlignedSecureTextField: FakeSecureTextField,
		fontForStyle: () => ({}),
		nativeColor: (value) => value,
		setTextFieldPlaceholder: () => {},
	})

	const plain = make({ value: 'name' })
	assert.ok(plain instanceof FakeTextField)
	assert.ok(plain instanceof FakeSecureTextField)
	assert.equal(plain.stringValue, 'name')

	const secure = make({ secure: true, value: 's3cret' })
	assert.ok(secure instanceof FakeSecureTextField)
	assert.equal(secure.stringValue, 's3cret')

	const view = make({ secure: true }, true)
	assert.ok(view instanceof FakeTextView)
})

function propsHarness() {
	const warnings = []
	const actionHandlers = new Map()
	const { applyProps } = runInNewContext(propApplication + '\n({ applyProps })', {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
		actionHandlers,
		actionIdsByView: new WeakMap(),
		textNodesByView: new WeakMap(),
		stackAccessibilityPropsByView: new WeakMap(),
		accessibilityLabels: new Map(),
		accessibilityRoles: new Map(),
		panHandlersByView: new WeakMap(),
		isStackLayoutInput: (name) =>
			['flexDirection', 'gap', 'rowGap', 'columnGap', 'alignItems', 'justifyContent'].includes(
				name,
			),
		AccessibleHostView: class {},
		syncStackLayout: () => {},
		console: {
			warn: (message) => warnings.push(message),
			error: (message) => warnings.push(message),
		},
		DEFAULT_TEXT_LINE_HEIGHT_RATIO: 21 / 16,
		applyStyle: () => {},
		applyClassName: () => {},
		syncText: () => {},
		syncTextViewPlaceholder: () => {},
		fitTextView: () => {},
		syncSecureTextField: (node) => {
			node.secureMode = Boolean(node.props.secure)
		},
		setTextFieldPlaceholder: () => {},
		nodeScheme: () => 'light',
		setSizeConstraint: () => {},
		setLayoutAction: () => {},
		layoutGridChildren: () => {},
		layoutAbsoluteChildren: () => {},
	})

	return { applyProps, warnings, actionHandlers }
}

test('isEnabled and editable map to native enabled/editable/selectable state', () => {
	const { applyProps } = propsHarness()
	const node = textNode('textfield')

	applyProps(node, { isEnabled: false })
	assert.equal(node.view.enabled, false)
	assert.equal(node.view.editable, false)
	assert.equal(node.view.selectable, false)

	applyProps(node, { isEnabled: true })
	assert.equal(node.view.enabled, true)
	assert.equal(node.view.editable, true)
	assert.equal(node.view.selectable, true)

	// Read-only: edits are rejected but the text stays selectable for copy.
	applyProps(node, { editable: false })
	assert.equal(node.view.enabled, true)
	assert.equal(node.view.editable, false)
	assert.equal(node.view.selectable, true)

	applyProps(node, { editable: true })
	assert.equal(node.view.editable, true)

	// Disabling wins over an explicit editable request.
	applyProps(node, { isEnabled: false })
	applyProps(node, { editable: true })
	assert.equal(node.view.editable, false)

	// NSTextView has no enabled flag: disabled maps to non-editable/non-selectable.
	const area = textNode('textview')
	applyProps(area, { isEnabled: false })
	assert.equal(area.view.editable, false)
	assert.equal(area.view.selectable, false)
})

test('secure changes reach the synchronizer while secure multiline entry warns', () => {
	const { applyProps, warnings } = propsHarness()
	const node = textNode('textfield')
	applyProps(node, { secure: true })
	assert.equal(node.secureMode, true)
	applyProps(node, { secure: false })
	assert.equal(node.secureMode, false)
	assert.equal(warnings.length, 0)
	applyProps(textNode('textview'), { secure: true })
	assert.equal(warnings.length, 1)
	assert.match(warnings[0], /secure is unsupported on <textview>/)
})

test('onTextChange reads the field value and onSubmit binds a separate submit handler', () => {
	const { applyProps, warnings, actionHandlers } = propsHarness()
	const node = textNode('textfield')
	node.view.stringValue = 'draft'

	const seen = []
	applyProps(node, { onTextChange: (value) => seen.push(['change', value]) })
	actionHandlers.get(7)()
	assert.deepEqual(seen, [['change', 'draft']])

	let submitted = 0
	applyProps(node, { onSubmit: () => submitted++ })
	node.submitHandler()
	assert.equal(submitted, 1)

	const area = textNode('textview')
	applyProps(area, { onSubmit: () => {} })
	assert.equal(warnings.length, 0)
})

test('text-control accessibility props reach the native element', () => {
	const { applyProps } = propsHarness()
	const node = textNode('textfield')
	applyProps(node, { accessibilityLabel: 'Email' })
	assert.deepEqual(node.view.calls, [['setAccessibilityLabel', 'Email']])

	const area = textNode('textview')
	applyProps(area, { accessibilityHint: 'Tell us more' })
	applyProps(area, { accessibilityState: { disabled: true } })
	assert.deepEqual(area.view.calls, [
		['setAccessibilityHint', 'Tell us more'],
		['setAccessibilityEnabled', false],
	])
})

test('per-edit delegate events fire the change handler while the action fires submit', () => {
	const actionHandlers = new Map()
	const actionIdsByView = new WeakMap()
	const textNodesByView = new WeakMap()
	const { ButtonActionTarget } = runInNewContext(targetClass + '\n({ ButtonActionTarget })', {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
		NSObject: class {},
		NativeClass: () => {},
		registerGestureClass: () => {},
		interop: { types: { void: 'void', bool: 'bool', id: 'id' } },
		NSButton: class {},
		NSPanGestureRecognizer: class {},
		NSNotification: class {},
		NSTextViewDelegate: {},
		NSTextFieldDelegate: {},
		actionHandlers,
		actionIdsByView,
		textNodesByView,
		panHandlersByView: new WeakMap(),
		invokeAction: (id) => actionHandlers.get(id)?.(),
		syncTextViewPlaceholder: () => {},
		fitTextView: () => {},
		syncSecureTextField: (node) => {
			node.secureMode = Boolean(node.props.secure)
		},
		console,
	})

	const target = new ButtonActionTarget()
	const field = {}
	const events = []
	actionHandlers.set(7, () => events.push('change'))
	textNodesByView.set(field, { actionId: 7, submitHandler: () => events.push('submit') })

	target.controlTextDidChange({ object: field })
	assert.deepEqual(events, ['change'])

	target.textFieldSubmitted(field)
	assert.deepEqual(events, ['change', 'submit'])

	// The textview delegate path is unchanged.
	const area = {}
	actionHandlers.set(8, () => events.push('area-change'))
	actionIdsByView.set(area, 8)
	textNodesByView.set(area, { actionId: 8 })
	target.textDidChange({ object: area })
	assert.deepEqual(events, ['change', 'submit', 'area-change'])
})
