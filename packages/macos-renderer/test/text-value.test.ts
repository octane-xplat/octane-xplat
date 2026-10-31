import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTextValueWriter, disposeTextValue, isWritingTextValue, setTextValue } from '../src/text-value.ts'

function fixture(initial = 'marked') {
	let text = initial, marked = true, releases = 0
	const listeners = new Set<() => void>(), jobs: (() => void)[] = [], cancelled = new Set<unknown>()
	const writes: string[] = []
	const writer = createTextValueWriter({
		read: () => text, marked: () => marked,
		write: (value) => { assert.equal(writer.isWriting, true); text = value; writes.push(value) },
		observeCommit: (notify) => { listeners.add(notify); return () => { listeners.delete(notify); releases++ } },
	}, {
		schedule: (callback) => { jobs.push(callback); return callback },
		cancel: (job) => { cancelled.add(job) },
	})
	return {
		writer, writes, jobs, cancelled, listeners,
		get text() { return text }, get releases() { return releases },
		marked: (value: boolean) => { marked = value }, nativeText: (value: string) => { text = value },
		notify: () => listeners.forEach((notify) => notify()),
		run: () => { const pending = jobs.splice(0); for (const job of pending) {if (!cancelled.has(job)) {job()}} },
	}
}

test('marked text remains intact and the latest pending external value applies after commit', () => {
	const f = fixture()
	f.writer.update('first')
	f.writer.update('latest')
	assert.equal(f.text, 'marked')
	assert.equal(f.listeners.size, 1)
	f.notify(); f.notify()
	assert.equal(f.jobs.length, 1)
	f.run()
	assert.deepEqual(f.writes, [])
	f.marked(false); f.notify(); f.run()
	assert.deepEqual(f.writes, ['latest'])
	assert.equal(f.listeners.size, 0)
	assert.equal(f.releases, 1)
	f.writer.dispose()
})

test('a matching native echo or unset value cancels stale external work', () => {
	for (const echo of ['marked', undefined]) {
		const f = fixture()
		f.writer.update('stale')
		f.writer.flushLater()
		const stale = f.jobs[0]
		f.writer.update(echo)
		f.marked(false)
		stale() // A late scheduler callback cannot bypass cancellation.
		assert.deepEqual(f.writes, [])
		assert.equal(f.listeners.size, 0)
		f.writer.dispose()
	}
})

test('a committed onChange echo supersedes an external value before the scheduled flush', () => {
	const f = fixture()
	f.writer.update('external')
	f.marked(false)
	f.nativeText('committed')
	f.writer.flushLater()
	f.writer.update('committed')
	f.run()
	assert.equal(f.text, 'committed')
	assert.deepEqual(f.writes, [])
	f.writer.dispose()
})

test('new composition delays an old scheduled flush and teardown cancels observer and work', () => {
	const f = fixture()
	f.writer.update('external')
	f.marked(false); f.notify()
	f.marked(true); f.run()
	assert.deepEqual(f.writes, [])
	assert.equal(f.listeners.size, 1)
	f.marked(false); f.notify()
	const stale = f.jobs[0]
	f.writer.dispose(); f.writer.dispose()
	stale()
	f.writer.update('removed')
	assert.deepEqual(f.writes, [])
	assert.equal(f.listeners.size, 0)
	assert.equal(f.releases, 1)
})

test('ordinary external writes are immediate, equal values skip setters, and failures clear write state', () => {
	const f = fixture('initial')
	f.marked(false)
	f.writer.update('initial')
	f.writer.update('changed')
	assert.deepEqual(f.writes, ['changed'])
	assert.equal(f.writer.isWriting, false)
	f.writer.dispose()
	const writer = createTextValueWriter({ read: () => '', marked: () => false, write: () => { throw new Error('native failure') } })
	assert.throws(() => writer.update('next'), /native failure/)
	assert.equal(writer.isWriting, false)
	writer.dispose()
})


test('native adapters read the field editor, clamp selection and scope commit observers to their window', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const body = source.slice(source.indexOf('function updateNativeTextValue('), source.indexOf('function syncTextControlState('))
	for (const type of ['textfield', 'textview']) {
		let adapter: any, observed: any[] = [], removed = 0, remembered = 0
		const { updateNativeTextValue } = runSlice(body + '\n({ updateNativeTextValue })', {
			setTextValue: (_view: unknown, _value: string, create: () => unknown) => { adapter = create() },
			rememberTextLimitValue() { remembered++ }, syncTextViewPlaceholder() {}, fitTextView() {},
			NSWindowDidUpdateNotification: 'window-update',
			NSNotificationCenter: { defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (...args: any[]) => { observed = args; return 7 },
				removeObserver: (token: number) => { assert.equal(token, 7); removed++ },
			} },
		})
		const editor = { string: 'marked native', hasMarkedText: () => true, selectedRange: { location: 8, length: 2 } }
		const view: any = type === 'textview' ? editor : { stringValue: 'stale model', currentEditor: () => editor }
		view.window = {}
		updateNativeTextValue({ type, view }, 'next')
		assert.equal(adapter.read(), 'marked native')
		assert.equal(adapter.marked(), true)
		let notifications = 0
		const notify = () => { notifications++ }
		const detach = adapter.observeCommit(notify)
		assert.equal(observed[0], 'window-update')
		assert.equal(observed[1], view.window)
		observed[3](); assert.equal(notifications, 1)
		detach(); detach()
		assert.equal(removed, 1)
		observed[3](); assert.equal(notifications, 1)
		view.window = null
		observed = []
		assert.equal(adapter.observeCommit(notify), undefined)
		assert.equal(observed.length, 0)
		editor.hasMarkedText = () => false
		adapter.write('new')
		assert.equal(editor.string, 'new')
		// The vm slice allocates the range in its own realm — spread before
		// comparing so the foreign Object.prototype does not trip strictEqual.
		assert.deepEqual({ ...editor.selectedRange }, { location: 3, length: 0 })
		assert.equal(remembered, type === 'textview' ? 1 : 0)
		if (type === 'textfield') {assert.equal(view.stringValue, 'new')}
	}
})


test('nested controlled writes keep notification suppression active until the outer write finishes', () => {
	let text = ''
	const writer = createTextValueWriter({ read: () => text, marked: () => false, write: (value) => {
		text = value
		if (value === 'outer') {writer.update('inner')}
		assert.equal(writer.isWriting, true)
	} })
	writer.update('outer')
	assert.equal(text, 'inner')
	assert.equal(writer.isWriting, false)
	writer.dispose()
})


test('programmatic native change notifications do not call public onChange during a write', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const body = source.slice(source.indexOf('class ButtonActionTarget'), source.indexOf('const buttonActionTarget'))
	let changes = 0
	const { ButtonActionTarget } = runSlice(body + '\n({ ButtonActionTarget })', {
		NSObject: class {}, NSButton: class {}, NSPanGestureRecognizer: class {}, NSNotification: class {},
		NSTextViewDelegate: {}, NSTextFieldDelegate: {},
		interop: { types: { void: 'void' } }, registerGestureClass() {},
		isWritingTextValue, invokeAction: () => { changes++ },
	})
	const target = new ButtonActionTarget()
	for (const event of ['controlTextDidChange', 'textDidChange']) {
		const view = {}
		let text = 'initial'
		try {
			setTextValue(view, 'next', () => ({ read: () => text, marked: () => false, write: (value) => {
				text = value
				target[event]({ object: view })
			} }))
			assert.equal(text, 'next')
			assert.equal(changes, 0)
		} finally { disposeTextValue(view) }
	}
})


test('single-line and native search submit leave marked confirmation to the input context', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const body = source.slice(source.indexOf('class ButtonActionTarget'), source.indexOf('const buttonActionTarget'))
	const nodes = new WeakMap()
	let submits = 0
	const { ButtonActionTarget } = runSlice(body + '\n({ ButtonActionTarget })', {
		NSObject: class {}, NSButton: class {}, NSPanGestureRecognizer: class {}, NSNotification: class {},
		NSTextViewDelegate: {}, NSTextFieldDelegate: {},
		interop: { types: { void: 'void' } }, registerGestureClass() {},
		textNodesByView: nodes, notifyTextValueCommit() {},
	})
	const target = new ButtonActionTarget()
	const editor: any = { hasMarkedText: () => true }
	const field = { currentEditor: () => editor }
	const search = {}
	nodes.set(field, { submitHandler: () => { submits++ } })
	nodes.set(search, { type: 'searchbar', submitHandler: () => { submits++ } })
	for (const marked of [() => true, true]) {
		editor.hasMarkedText = marked
		target.textFieldSubmitted(field)
		assert.equal(target.controlTextViewDoCommandBySelector(search, editor, 'insertNewline:'), false)
		assert.equal(submits, 0)
	}
	editor.hasMarkedText = () => false
	target.textFieldSubmitted(field)
	assert.equal(target.controlTextViewDoCommandBySelector(search, editor, 'insertNewline:'), true)
	assert.equal(submits, 2)
	assert.equal(target.controlTextViewDoCommandBySelector(search, editor, 'moveLeft:'), false)
})
