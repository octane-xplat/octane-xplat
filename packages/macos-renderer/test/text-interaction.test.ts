import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const helpers = source.slice(
	source.indexOf('function dispatchTextEvent('),
	source.indexOf('function setAction('),
)

const delegate = source.slice(
	source.indexOf('class ButtonActionTarget'),
	source.indexOf('const buttonActionTarget'),
)

function load() {
	const nodes = new WeakMap()
	const context = {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
		textNodesByView: nodes,
		actionIdsByView: new WeakMap(),
		actionHandlers: new Map(),
		NSObject: class {},
		NSTextViewDelegate: {},
		NSTextFieldDelegate: {},
		NSButton: {},
		NSPanGestureRecognizer: {},
		NSNotification: {},
		interop: { types: { void: {} } },
		NativeClass() {},
		registerGestureClass() {},
		DEFAULT_TEXT_LINE_HEIGHT_RATIO: 21 / 16,
		setSizeConstraint(node, name, value) {
			node.sizeConstraintSpecs = { [name]: { points: value } }
			node.height = value
		},
		InteractionSecureTextFieldCell: { alloc: () => ({ initTextCell: () => ({ secure: true }) }) },
		InteractionTextFieldCell: { alloc: () => ({ initTextCell: () => ({ secure: false }) }) },
	}

	return {
		nodes,
		...runInNewContext(
			helpers +
				'\n' +
				delegate +
				'\n({ dispatchTextEvent, fitTextView, syncSecureTextField, ButtonActionTarget })',
			context,
		),
	}
}

function node(props = {}) {
	return { props, container: { root: { eventScope: (_kind, run) => run() } } }
}

test('focus transitions deduplicate notifications and read the latest callbacks', () => {
	const { dispatchTextEvent } = load()
	const calls = []
	const control = node({ onFocus: () => calls.push('focus'), onBlur: () => calls.push('blur') })
	dispatchTextEvent(control, 'onFocus')
	dispatchTextEvent(control, 'onFocus')
	control.props.onBlur = () => calls.push('new blur')
	dispatchTextEvent(control, 'onBlur')
	dispatchTextEvent(control, 'onBlur')
	assert.deepEqual(calls, ['focus', 'new blur'])
})

test('multiline action returns submit once; ordinary Return remains a newline', () => {
	const { nodes, ButtonActionTarget } = load()
	const view = {}
	let submits = 0
	const control = node({ onSubmit: () => submits++ })
	nodes.set(view, control)
	const target = new ButtonActionTarget()
	for (const key of [undefined, 'next', 'go', 'search']) {
		control.props.returnKeyType = key
		assert.equal(target.textViewDoCommandBySelector(view, 'insertNewline:'), false)
	}

	for (const key of ['done', 'send']) {
		control.props.returnKeyType = key
		assert.equal(target.textViewDoCommandBySelector(view, 'insertNewline:'), true)
		assert.equal(target.textViewDoCommandBySelector(view, 'insertTab:'), false)
	}

	assert.equal(submits, 2)
	control.props.onSubmit = undefined
	assert.equal(target.textViewDoCommandBySelector(view, 'insertNewline:'), true)
})

test('growth uses measured wrapped content, caps viewport, and preserves full document', () => {
	const { fitTextView } = load()
	let measured = 120
	const control = node({ rows: 2, autoGrow: true, maxRows: 3 })
	control.view = {
		font: { ascender: 15, descender: -5, leading: 0 },
		textContainer: {},
		layoutManager: {
			ensureLayoutForTextContainer() {},
			usedRectForTextContainer: () => ({ size: { height: measured } }),
			extraLineFragmentRect: { size: { height: 0 } },
		},
		frame: { size: { width: 100 } },
		setFrameSize(size) {
			this.frame = { size }
		},
	}

	control.textViewport = { contentView: { bounds: { size: { width: 100, height: 0 } } } }
	fitTextView(control)
	assert.equal(control.height, 60)
	assert.equal(control.view.frame.size.height, 120)
	control.props.maxRows = undefined
	fitTextView(control)
	assert.equal(control.height, 120)
	measured = 20
	fitTextView(control)
	assert.equal(control.height, 40)
	control.props.autoGrow = false
	measured = 200
	fitTextView(control)
	assert.equal(control.height, 40)
	control.props.style = { height: 90 }
	fitTextView(control)
	assert.equal(control.height, 40, 'explicit height is owned by style application')
})

test('secure changes keep the view, current editor text, selection and submit wiring', () => {
	const { syncSecureTextField } = load()
	const editor = { string: 'typed', selectedRange: { location: 2, length: 1 } }
	const target = {}
	const control = node({ secure: true })
	const field = (control.view = {
		cell: { target, action: 'controlChanged', tag: 42, font: 'font', enabled: true },
		currentEditor: () => editor,
		stringValue: 'stale',
		window: { makeFirstResponder() {} },
	})

	syncSecureTextField(control)
	assert.equal(control.view, field)
	assert.equal(field.cell.secure, true)
	assert.equal(field.stringValue, 'typed')
	assert.equal(field.cell.target, target)
	assert.equal(field.cell.action, 'controlChanged')
	assert.equal(editor.selectedRange.location, 2)
	control.props.secure = false
	syncSecureTextField(control)
	assert.equal(field.cell.secure, false)
	assert.equal(field.cell.font, 'font')
})
