import assert from 'node:assert/strict'
import test from 'node:test'
import { borderStyleSides, hiddenBorderStyle, borderStrokeStyle } from '../src/border-styles.ts'

test('border styles expand CSS side order and preserve explicit shorthand/side ordering', () => {
	assert.deepEqual(borderStyleSides({ borderStyle: 'dashed dotted solid hidden' }), {
		top: 'dashed', right: 'dotted', bottom: 'solid', left: 'hidden',
	})
	assert.deepEqual(borderStyleSides({ borderStyle: 'dashed dotted' }), {
		top: 'dashed', right: 'dotted', bottom: 'dashed', left: 'dotted',
	})
	assert.deepEqual(borderStyleSides({ borderStyle: 'dashed', borderLeftStyle: 'none', borderRight: '2px dotted rgb(1, 2, 3)' }), {
		top: 'dashed', right: 'dotted', bottom: 'dashed', left: 'none',
	})
	assert.deepEqual(borderStyleSides({ borderTopStyle: 'dashed', border: '1px solid red' }), {
		top: 'solid', right: 'solid', bottom: 'solid', left: 'solid',
	})
	assert.equal(borderStyleSides({ borderWidth: 1 }).top, 'solid')
})

test('pattern metrics scale with width and hidden styles remain separate from solid painting', () => {
	assert.deepEqual(borderStrokeStyle('dashed', 2), { pattern: [6, 6], cap: 'butt' })
	assert.deepEqual(borderStrokeStyle('dotted', 1.5), { pattern: [0, 3], cap: 'round' })
	for (const width of [0, -1, NaN, Infinity, Number.MAX_VALUE]) assert.equal(borderStrokeStyle('dashed', width), null)
	for (const style of ['solid', 'none', 'hidden', 'double']) assert.equal(borderStrokeStyle(style, 2), null)
	assert.equal(hiddenBorderStyle('none'), true)
	assert.equal(hiddenBorderStyle('hidden'), true)
	assert.equal(hiddenBorderStyle('dashed'), false)
})


test('border resolution ignores unrelated style values and inherited dictionary names', () => {
	const unsafe = { toString() { throw Error('unrelated style coerced') } }
	assert.deepEqual(borderStyleSides({ transform: unsafe, constructor: unsafe, backgroundImage: unsafe, borderStyle: 'dotted' }), {
		top: 'dotted', right: 'dotted', bottom: 'dotted', left: 'dotted',
	})
})
