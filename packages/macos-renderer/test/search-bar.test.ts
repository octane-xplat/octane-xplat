import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const slice = (a: string, b: string) => source.slice(source.indexOf(a), source.indexOf(b))
function fixture() {
	const actionHandlers = new Map(),
		textNodesByView = new WeakMap(),
		scopes: string[] = []

	const api = runInNewContext(
		[
			slice('class ButtonActionTarget', 'const buttonActionTarget'),
			slice('function makeSearchBar(', 'function makeSwitch('),
			slice('function invokeAction(', 'class ButtonActionTarget'),
			slice('function setControlAction(', '/** `isEnabled`/`editable`'),
			slice('function droppedPropClears(', 'function applyProps('),
			'({ makeSearchBar, syncSearchBar, notifySearchTextChange, ButtonActionTarget, setTextSubmitAction, droppedPropClears })',
		].join('\n'),
		{
			NSObject: class {},
			NSTextViewDelegate: {},
			NSTextFieldDelegate: {},
			NSButton: class {},
			NSPanGestureRecognizer: class {},
			NSNotification: class {},
			interop: { types: { void: 'void', bool: 'bool' } },
			registerGestureClass() {},
			NSSearchField: class {
				static alloc() {
					return new this()
				}
				cell = {}
				initWithFrame(frame: any) {
					this.frame = frame
					return this
				}
			},
			actionHandlers,
			textNodesByView,
			actionIdsByView: new WeakMap(),
			console,
		},
	)

	const view = api.makeSearchBar()
	const node = {
		type: 'searchbar',
		text: '',
		view,
		actionId: 1,
		props: {},
		container: {
			root: {
				eventScope(scope: string, fn: any) {
					scopes.push(scope)
					fn()
				},
			},
		},
	}

	textNodesByView.set(view, node)
	const target = new api.ButtonActionTarget()
	return { ...api, view, node, target, scopes, actionHandlers, textNodesByView }
}

test('SearchBar starts empty and suppresses search/end-editing actions', () => {
	const { view } = fixture()
	assert.equal(view.stringValue, '')
	assert.equal(view.placeholderString, '')
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	assert.equal(view.sendsSearchStringImmediately, false)
	assert.equal(view.sendsWholeSearchString, true)
	assert.equal(view.cell.sendsActionOnEndEditing, false)
})

test('per-edit SearchBar changes preserve payload, prior value, scope and deduplicate strings', () => {
	const f = fixture(),
		events: any[] = []

	f.node.props.onTextChange = (event: any) => events.push(event)
	f.view.stringValue = 'query'
	f.target.controlTextDidChange({ object: f.view })
	f.target.controlTextDidChange({ object: f.view })
	assert.equal(events.length, 1)
	assert.equal(events[0].object, f.view)
	assert.equal(events[0].eventName, 'textChange')
	assert.equal(events[0].value, 'query')
	assert.equal(events[0].oldValue, '')
	assert.deepEqual(f.scopes, ['discrete'])
})

test('SearchBar submits only Return; clearing and other field commands do not submit', () => {
	const f = fixture(),
		events: string[] = []

	f.node.props.onTextChange = () => events.push('change')
	f.setTextSubmitAction(f.node, () => events.push('submit'))
	f.view.stringValue = 'query'
	f.target.controlTextDidChange({ object: f.view })
	assert.equal(f.target.controlTextViewDoCommandBySelector(f.view, null, 'insertNewline:'), true)
	assert.equal(f.target.controlTextViewDoCommandBySelector(f.view, null, 'cancelOperation:'), false)
	f.view.stringValue = ''
	f.target.controlTextDidChange({ object: f.view })
	assert.deepEqual(events, ['change', 'submit', 'change'])
	assert.equal(f.target.controlTextViewDoCommandBySelector({}, null, 'insertNewline:'), false)
})

test('SearchBar text/hint updates and removed props restore defaults on the same host', () => {
	const f = fixture(),
		values: string[] = []

	f.node.props = {
		text: 'one',
		hint: 'Find',
		onTextChange: (event: any) => values.push(event.value),
	}

	f.syncSearchBar(f.node, f.node.props)
	assert.equal(f.view.stringValue, 'one')
	assert.equal(f.view.placeholderString, 'Find')
	const next = { text: 'two', onTextChange: f.node.props.onTextChange }
	const update = { ...f.droppedPropClears(f.node, next), ...next }
	f.node.props = { ...f.node.props, ...update }
	f.syncSearchBar(f.node, update)
	assert.equal(f.view.stringValue, 'two')
	assert.equal(f.view.placeholderString, '')
	const keep = { onTextChange: f.node.props.onTextChange }
	const clear = { ...f.droppedPropClears(f.node, keep), ...keep }
	f.node.props = { ...f.node.props, ...clear }
	f.syncSearchBar(f.node, clear)
	assert.equal(f.view.stringValue, '')
	assert.equal(f.view.placeholderString, '')
	assert.deepEqual(values, ['one', 'two', ''])
})

test('SearchBar binds current handlers and removed handlers stay silent', () => {
	const f = fixture(),
		events: string[] = []

	f.node.props.onTextChange = () => events.push('old')
	f.view.stringValue = 'one'
	f.target.controlTextDidChange({ object: f.view })
	f.node.props.onTextChange = () => events.push('new')
	f.view.stringValue = 'two'
	f.target.controlTextDidChange({ object: f.view })
	f.node.props = { ...f.node.props, ...f.droppedPropClears(f.node, {}) }
	f.setTextSubmitAction(f.node, undefined)
	f.view.stringValue = 'three'
	f.target.controlTextDidChange({ object: f.view })
	f.target.controlTextViewDoCommandBySelector(f.view, null, 'insertNewline:')
	assert.deepEqual(events, ['old', 'new'])
	assert.equal(f.node.text, 'three')
})

test('SearchBar delegate lookup does not dispatch after its ownership is released', () => {
	const f = fixture()
	let count = 0
	f.node.props.onTextChange = () => count++
	f.setTextSubmitAction(f.node, () => count++)
	f.textNodesByView.delete(f.view)
	f.actionHandlers.delete(f.node.actionId)
	f.view.stringValue = 'stale'
	f.target.controlTextDidChange({ object: f.view })
	assert.equal(f.target.controlTextViewDoCommandBySelector(f.view, null, 'insertNewline:'), false)
	assert.equal(count, 0)
})

test('SearchBar rejects view, text and projected children in batch preflight', () => {
	const { validateBatch } = runInNewContext(
		slice('const VIEW_PARENT_TYPES', '/** Deterministic prop failures') +
		slice('function parentReference(', 'function isPortalTargetView(') +
		slice('function validateTextNesting(', 'function insert(') + slice('function validateBatch(', 'function applyCommand(') + '\n({ validateBatch })', {},
	)

	for (const type of ['label', '#text', 'span', 'proxyviewcontainer']) {
		const container = { nodes: new Map([[1, { type: 'searchbar', props: {} }], [2, { type, props: {} }]]) }
		assert.throws(() => validateBatch(container, [{ op: 'insert', id: 2, parent: 1, before: null }]), /searchbar.*cannot contain children/)
	}
})
