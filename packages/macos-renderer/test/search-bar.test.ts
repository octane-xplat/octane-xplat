import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { createTextValueWriter } from '../src/text-value.ts'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const slice = (a: string, b: string) => source.slice(source.indexOf(a), source.indexOf(b))
function fixture() {
	const actionHandlers = new Map(),
		textNodesByView = new WeakMap(),
		scopes: string[] = []

	const writers = new Map<object, ReturnType<typeof createTextValueWriter>>()
	const jobs: (() => void)[] = [], cancelled = new Set<unknown>()
	const observers = new Map<object, () => void>()
	const api = runSlice(
		[
			slice('class ButtonActionTarget', 'const buttonActionTarget'),
			slice('function makeSearchBar(', 'function makeSwitch('),
			slice('function updateNativeTextValue(', 'function syncTextControlState('),
			slice('function invokeAction(', 'class ButtonActionTarget'),
			slice('function setControlAction(', '/** `isEnabled`/`editable`'),
			slice('function droppedPropClears(', 'function applyProps('),
			'({ makeSearchBar, syncSearchBar, notifySearchTextChange, ButtonActionTarget, setTextSubmitAction, droppedPropClears })',
		].join('\n'),
		{
			setTextValue: (view: object, value: string | undefined, create: any) => {
				let writer = writers.get(view)
				if (!writer && value !== undefined) {
					writer = createTextValueWriter(create(), {
						schedule: (job) => { jobs.push(job); return job },
						cancel: (job) => { cancelled.add(job) },
					})
					writers.set(view, writer)
				}
				writer?.update(value)
			},
			isWritingTextValue: (view: object) => writers.get(view)?.isWriting ?? false,
			notifyTextValueCommit: (view: object) => writers.get(view)?.flushLater(),
			NSWindowDidUpdateNotification: 'window-update',
			NSNotificationCenter: { defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (_name, window, _queue, notify) => { observers.set(window, notify); return window },
				removeObserver: (window) => { observers.delete(window) },
			} },
			elementBehaviors: new Map(),
			behaviorOf: () => undefined,
			isManualLayoutParent: (t: string) =>
				[
					'gridlayout',
					'liquidglass',
					'absolutelayout',
					'contentview',
					'actionbar',
					'docklayout',
					'wraplayout',
					'rootlayout',
				].includes(t),
			registerElementType: () => {},

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
				editor: any = null
				window = {}
				currentEditor() { return this.editor }
				initWithFrame(frame: any) {
					this.frame = frame
					return this
				}
			},
			actionHandlers,
			textNodesByView,
			actionIdsByView: new WeakMap(),
			dispatchTextEvent() {},
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
	return { ...api, view, node, target, scopes, actionHandlers, textNodesByView, writers, observers,
		runJobs() { for (const job of jobs.splice(0)) if (!cancelled.has(job)) job() },
	}
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
	const { validateBatch } = runSlice(
		slice('const VIEW_PARENT_TYPES', '/** Deterministic prop failures') +
			slice('function parentReference(', 'function isPortalTargetView(') +
			slice('function validateTextNesting(', 'function insert(') +
			slice('function validateBatch(', 'function applyCommand(') +
			'\n({ validateBatch })',
		{
			elementBehaviors: new Map(),
			behaviorOf: () => undefined,
			isManualLayoutParent: (t: string) =>
				[
					'gridlayout',
					'liquidglass',
					'absolutelayout',
					'contentview',
					'actionbar',
					'docklayout',
					'wraplayout',
					'rootlayout',
				].includes(t),
			registerElementType: () => {},
		},
	)

	for (const type of ['label', '#text', 'span', 'proxyviewcontainer']) {
		const container = {
			nodes: new Map([
				[1, { type: 'searchbar', props: {} }],
				[2, { type, props: {} }],
			]),
		}

		assert.throws(
			() => validateBatch(container, [{ op: 'insert', id: 2, parent: 1, before: null }]),
			/searchbar.*cannot contain children/,
		)
	}
})


test('SearchBar preserves marked editor text until the latest external value can commit', () => {
	const f = fixture(), values: string[] = []
	f.node.props.onTextChange = (event: any) => values.push(event.value)
	f.view.editor = { string: 'marked', hasMarkedText: () => true, selectedRange: { location: 6, length: 0 } }
	f.target.controlTextDidChange({ object: f.view })
	assert.equal(f.node.text, 'marked') // Read the live field editor, not the stale model.
	for (const text of ['first', 'latest']) {
		f.node.props.text = text
		f.syncSearchBar(f.node, { text })
	}
	assert.equal(f.view.editor.string, 'marked')
	assert.deepEqual(values, ['marked'])
	assert.equal(f.observers.size, 1)
	f.view.editor.hasMarkedText = () => false
	f.target.controlTextDidEndEditing({ object: f.view })
	f.runJobs()
	assert.equal(f.view.stringValue, 'latest')
	assert.equal(f.view.editor.string, 'latest')
	assert.deepEqual(values, ['marked', 'latest'])
	assert.equal(f.observers.size, 0)
})

test('SearchBar native echo supersedes deferred text and teardown cancels pending work', () => {
	const f = fixture(), values: string[] = []
	f.node.props.onTextChange = (event: any) => values.push(event.value)
	f.view.editor = { string: 'composing', hasMarkedText: () => true }
	f.node.props.text = 'external'
	f.syncSearchBar(f.node, { text: 'external' })
	f.view.editor.string = 'committed'
	f.view.editor.hasMarkedText = () => false
	f.target.controlTextDidChange({ object: f.view })
	f.node.props.text = 'committed'
	f.syncSearchBar(f.node, { text: 'committed' })
	f.runJobs()
	assert.deepEqual(values, ['committed'])
	assert.equal(f.view.editor.string, 'committed')
	assert.equal(f.observers.size, 0)
	f.view.editor.hasMarkedText = () => true
	f.node.props.text = ''
	f.syncSearchBar(f.node, { text: undefined })
	f.writers.get(f.view)!.flushLater()
	f.writers.get(f.view)!.dispose()
	f.view.editor.hasMarkedText = () => false
	f.runJobs()
	assert.equal(f.view.editor.string, 'committed')
	assert.equal(f.observers.size, 0)
})


test('SearchBar deferred clear uses the current handler and emits one property change', () => {
	const f = fixture(), values: string[] = []
	f.node.props.onTextChange = () => { throw new Error('stale handler') }
	f.view.editor = { string: 'marked', hasMarkedText: () => true }
	f.node.text = 'marked'
	f.node.props.text = ''
	f.syncSearchBar(f.node, { text: undefined })
	f.node.props.onTextChange = (event: any) => values.push(event.value)
	f.view.editor.hasMarkedText = () => false
	f.target.controlTextDidEndEditing({ object: f.view })
	f.runJobs()
	f.target.controlTextDidChange({ object: f.view })
	assert.equal(f.view.editor.string, '')
	assert.deepEqual(values, [''])
})
