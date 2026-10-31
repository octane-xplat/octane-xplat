import { disposeTextValue, isWritingTextValue, notifyTextValueCommit, setTextValue } from '../src/text-value.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enforceTextLimit, excessTextRange, isNormalizingTextLimit, recordTextLimitEdit, rememberTextLimitValue, reportTextLimitChange, type TextRange } from '../src/text-limit.ts'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const remove = (text: string, range: TextRange | null) => range ? text.slice(0, range.location) + text.slice(range.location + range.length) : text

test('length caps bound the insertion and retain original text around a paste/replacement', () => {
	assert.equal(remove('abcXYZdef', excessTextRange('abcdef', 'abcXYZdef', 8, { location: 3, length: 0 })), 'abcXYdef')
	assert.equal(remove('abXYZef', excessTextRange('abcdef', 'abXYZef', 6, { location: 2, length: 2 })), 'abXYef')
	assert.equal(remove('aaaa', excessTextRange('aaa', 'aaaa', 3, { location: 1, length: 0 })), 'aaa')
	assert.deepEqual(excessTextRange('aaa', 'aaaa', 3, { location: 1, length: 0 }), { location: 1, length: 1 })
	assert.equal(excessTextRange('long value', 'long valu', 3, { location: 9, length: 1 }), null)
	for (const cap of [undefined, null, NaN, Infinity, -1, 2.5, '3']) {assert.equal(excessTextRange('', 'long', cap), null)}
	assert.equal(remove('value', excessTextRange('', 'value', 0)), '')
	assert.equal(remove('A😀B', excessTextRange('', 'A😀B', 2)), 'A')
	assert.equal(remove('😁x', excessTextRange('😀', '😁x', 1)), '')
})

function fixture(before = 'abcd') {
	let composing = false
	const notifications: boolean[] = []
	const view = {
		string: before,
		selectedRange: { location: before.length, length: 0 },
		hasMarkedText: () => composing,
		textStorage: { replaceCharactersInRangeWithString(range: TextRange, text: string) {
			view.string = view.string.slice(0, range.location) + text + view.string.slice(range.location + range.length)
		} },
		shouldChangeTextInRangeReplacementString: () => true,
		didChangeText() { notifications.push(isNormalizingTextLimit(view)) },
	}
	rememberTextLimitValue(view)
	return { view, notifications, compose: (value: boolean) => { composing = value } }
}

test('committed edits preserve their selection and guard the correction notification', () => {
	const { view, notifications } = fixture()
	recordTextLimitEdit(view, { location: 2, length: 0 })
	view.string = 'abXYZcd'
	rememberTextLimitValue(view, true) // Reapplying a cap cannot discard a pending edit.
	view.selectedRange = { location: 5, length: 0 }
	assert.equal(enforceTextLimit(view, 5), true)
	assert.equal(view.string, 'abXcd')
	assert.deepEqual(view.selectedRange, { location: 3, length: 0 })
	assert.deepEqual(notifications, [true])
	assert.equal(isNormalizingTextLimit(view), false)
	assert.equal(enforceTextLimit(view, 5), false)
})

test('marked updates stay intact until commit, including an explicit unmark without a change event', () => {
	const { view, compose } = fixture()
	recordTextLimitEdit(view, { location: 1, length: 2 })
	compose(true)
	view.string = 'a候補編集中d'
	assert.equal(enforceTextLimit(view, 5), false)
	rememberTextLimitValue(view) // A marked controlled echo cannot overwrite the original base.
	recordTextLimitEdit(view, { location: 2, length: 1 })
	assert.equal(view.string, 'a候補編集中d')
	compose(false)
	view.selectedRange = { location: 6, length: 0 }
	assert.equal(enforceTextLimit(view, 5), true)
	assert.equal(view.string, 'a候補編d')
	assert.deepEqual(view.selectedRange, { location: 4, length: 0 })
})

test('programmatic values may exceed the cap; native vetoes/failures release the correction guard', () => {
	const { view } = fixture('external value')
	assert.equal(enforceTextLimit(view, 3), false)
	recordTextLimitEdit(view, { location: 0, length: view.string.length })
	view.string = 'replacement'
	view.shouldChangeTextInRangeReplacementString = () => false
	assert.equal(enforceTextLimit(view, 3), false)
	assert.equal(view.string, 'replacement')
	assert.equal(isNormalizingTextLimit(view), false)
	recordTextLimitEdit(view, { location: 0, length: view.string.length })
	view.string = 'another value'
	view.shouldChangeTextInRangeReplacementString = () => { throw new Error('native error') }
	assert.throws(() => enforceTextLimit(view, 3), /native error/)
	assert.equal(isNormalizingTextLimit(view), false)
})

test('native subclass unmark applies a deferred cap once', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const body = source.slice(source.indexOf('class InteractionTextView'), source.indexOf('class InteractionTextFieldCell'))
	const textNodesByView = new WeakMap()
	let unmarks = 0, normalizations = 0, changes = 0
	const { InteractionTextView } = runSlice(body + '\n({ InteractionTextView })', {
		notifyTextValueCommit,
		NSTextView: class { unmarkText() { unmarks++ } }, NativeClass() {}, textNodesByView,
		enforceTextLimit: () => ++normalizations === 1, reportTextLimitChange: () => true,
		syncTextViewPlaceholder() {}, fitTextView() {},
		invokeAction: () => { changes++ }, actionIdsByView: new WeakMap(),
	})
	const view = new InteractionTextView()
	textNodesByView.set(view, { props: { maxLength: 5 }, actionId: 7 })
	view.unmarkText()
	view.unmarkText()
	assert.equal(unmarks, 2)
	assert.equal(changes, 1)
})

test('delegate normalization exposes the corrected text once despite a nested native change notification', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const body = source.slice(source.indexOf('class ButtonActionTarget'), source.indexOf('const buttonActionTarget'))
	const { view } = fixture()
	const nodes = new WeakMap(), actions = new WeakMap()
	const values: string[] = []
	const { ButtonActionTarget } = runSlice(body + '\n({ ButtonActionTarget })', {
		NSObject: class {}, NSButton: class {}, NSPanGestureRecognizer: class {}, NSNotification: class {},
		NSTextViewDelegate: {}, NSTextFieldDelegate: {},
		interop: { types: { void: 'void' } }, registerGestureClass() {},
		textNodesByView: nodes, actionIdsByView: actions,
		enforceTextLimit, isNormalizingTextLimit, recordTextLimitEdit, reportTextLimitChange,
		isWritingTextValue, notifyTextValueCommit,
		syncTextViewPlaceholder() {}, fitTextView() {},
		invokeAction: () => values.push(view.string),
	})
	const target = new ButtonActionTarget()
	nodes.set(view, { props: { maxLength: 5 } })
	actions.set(view, 1)
	view.didChangeText = () => target.textDidChange({ object: view })
	target.textViewShouldChangeTextInRangeReplacementString(view, { location: 2, length: 0 }, 'XYZ')
	view.string = 'abXYZcd'
	target.textDidChange({ object: view })
	assert.deepEqual(values, ['abXcd'])
})


test('a wholly rejected insertion emits no duplicate value but composition restoration does', () => {
	const { view, compose } = fixture('full')
	recordTextLimitEdit(view, { location: 2, length: 0 })
	view.string = 'fuXll'
	enforceTextLimit(view, 4)
	assert.equal(view.string, 'full')
	assert.equal(reportTextLimitChange(view), false)
	recordTextLimitEdit(view, { location: 2, length: 0 })
	compose(true)
	view.string = 'fu候補ll'
	assert.equal(reportTextLimitChange(view), true)
	compose(false)
	enforceTextLimit(view, 4)
	assert.equal(view.string, 'full')
	assert.equal(reportTextLimitChange(view), true)
	assert.equal(reportTextLimitChange(view), false)
})
