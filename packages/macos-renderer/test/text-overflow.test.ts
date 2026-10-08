import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end))
const modes = { WordWrapping: 0, Clipping: 2, TruncatingTail: 4 }
function fixture() {
	const { applyProps } = runInNewContext(
		slice('function syncLabelOverflow(', 'function syncTextViewPlaceholder(') +
			slice('function applyProps(', 'function detach(') +
			'\n({ applyProps })',
		{
			NSLineBreakMode: modes,
			DEFAULT_TEXT_LINE_HEIGHT_RATIO: 21 / 16,
			setSizeConstraint: (node, name, value) => {
				node[name] = value
			},
			applyStyle() {},
			NSMutableParagraphStyle: { alloc: () => ({ init: () => ({}) }) },
			NSAttributedString: {
				alloc: () => ({ initWithStringAttributes: (text, attributes) => ({ text, attributes }) }),
			},
			NSParagraphStyleAttributeName: 'paragraph',
			NSFontAttributeName: 'font',
			NSForegroundColorAttributeName: 'color',
		},
	)

	const view = {
		cell: {},
		font: { pointSize: 16 },
		stringValue: '',
		invalidateIntrinsicContentSize() {},
	}

	const node = { type: 'label', props: {}, children: [], parent: null, view }
	return { node, view, update: (props) => applyProps(node, props) }
}

test('single-line labels preserve long and short source text across prop updates and removal', () => {
	const { node, view, update } = fixture()
	for (const text of ['A very long title '.repeat(20), 'Short']) {
		update({ text, maxLines: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis' })
		assert.equal(view.stringValue, text)
		assert.equal(view.maximumNumberOfLines, 1)
		assert.equal(view.cell.wraps, false)
		assert.equal(view.cell.lineBreakMode, modes.TruncatingTail)
		assert.equal(node.height, 21)
	}

	update({ textOverflow: undefined })
	assert.equal(view.cell.lineBreakMode, modes.Clipping)
	update({ maxLines: undefined, whiteSpace: undefined })
	assert.equal(view.maximumNumberOfLines, 0)
	assert.equal(view.cell.wraps, true)
	assert.equal(view.cell.usesSingleLineMode, false)
	assert.equal(view.cell.truncatesLastVisibleLine, false)
})

test('multiline limits wrap and truncate only the last visible line, and release implicit height', () => {
	const { node, view, update } = fixture()
	update({
		text: 'First\nSecond\nThird',
		maxLines: 2,
		whiteSpace: 'normal',
		textOverflow: 'ellipsis',
	})

	assert.equal(view.maximumNumberOfLines, 2)
	assert.equal(view.cell.lineBreakMode, modes.WordWrapping)
	assert.equal(view.cell.truncatesLastVisibleLine, true)
	assert.equal(node.height, undefined)
	update({ textOverflow: 'clip', maxLines: 0 })
	assert.equal(view.maximumNumberOfLines, 0)
	assert.equal(view.cell.truncatesLastVisibleLine, false)
	update({ whiteSpace: 'nowrap', maxLines: 3 })
	assert.equal(view.maximumNumberOfLines, 1)
	update({ maxLines: undefined, whiteSpace: undefined })
	assert.equal(node.height, 21)
})

test('custom line height carries the overflow mode in its paragraph without altering text', () => {
	const { view, update } = fixture()
	update({
		text: 'Complete title',
		maxLines: 1,
		textOverflow: 'ellipsis',
		style: { lineHeight: 28 },
	})

	assert.equal(view.attributedStringValue.text, 'Complete title')
	assert.equal(view.attributedStringValue.attributes.paragraph.lineBreakMode, modes.TruncatingTail)

	update({ maxLines: 2 })
	assert.equal(view.attributedStringValue.attributes.paragraph.lineBreakMode, modes.WordWrapping)
})

test('unsupported text modes and invalid limits fail explicitly', () => {
	for (const props of [
		{ whiteSpace: 'pre' },
		{ textOverflow: 'fade' },
		{ maxLines: -1 },
		{ maxLines: 1.5 },
		{ maxLines: NaN },
	]) {
		assert.throws(() => fixture().update(props), /\[macos-host\] label/)
	}
})
