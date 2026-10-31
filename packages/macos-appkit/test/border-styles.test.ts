import assert from 'node:assert/strict'
import test from 'node:test'
import { borderStyleSides, hiddenBorderStyle, borderStrokeStyle, borderBands, borderBandPoints, darkBorderComponents } from '../src/border-styles.ts'

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
	for (const width of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {assert.equal(borderStrokeStyle('dashed', width), null)}
	for (const style of ['solid', 'none', 'hidden', 'double']) {assert.equal(borderStrokeStyle(style, 2), null)}
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

test('borderBands partitions double/groove/ridge/inset/outset per side and collapses thin doubles', () => {
	const full = { from: 0, to: 1, shade: 'base' }
	for (const style of ['solid', 'dashed', 'dotted', 'none', 'hidden', 'bogus']) {
		for (const side of ['top', 'right', 'bottom', 'left'] as const) {
			assert.deepEqual(borderBands(style, side, 4), [full], `${style}/${side} stays one base band`)
		}
	}
	for (const side of ['top', 'right', 'bottom', 'left'] as const) {
		assert.deepEqual(borderBands('double', side, 4), [
			{ from: 0, to: 1 / 3, shade: 'base' },
			{ from: 2 / 3, to: 1, shade: 'base' },
		], `double/${side}`)
		assert.deepEqual(borderBands('double', side, 2), [full], `thin double/${side} falls back`)
		assert.deepEqual(borderBands('inset', side, 4), [{ ...full, shade: side === 'top' || side === 'left' ? 'dark' : 'base' }], `inset/${side}`)
		assert.deepEqual(borderBands('outset', side, 4), [{ ...full, shade: side === 'top' || side === 'left' ? 'base' : 'dark' }], `outset/${side}`)
		assert.deepEqual(borderBands('groove', side, 4), [
			{ from: 0, to: 0.5, shade: side === 'top' || side === 'left' ? 'dark' : 'base' },
			{ from: 0.5, to: 1, shade: side === 'top' || side === 'left' ? 'base' : 'dark' },
		], `groove/${side}`)
		assert.deepEqual(borderBands('ridge', side, 4), [
			{ from: 0, to: 0.5, shade: side === 'top' || side === 'left' ? 'base' : 'dark' },
			{ from: 0.5, to: 1, shade: side === 'top' || side === 'left' ? 'dark' : 'base' },
		], `ridge/${side}`)
	}
})

test('darkBorderComponents matches Chromium Color::Dark()', () => {
	assert.deepEqual(darkBorderComponents({ red: 0, green: 0, blue: 0, alpha: 0.5 }), {
		red: 84 / 255, green: 84 / 255, blue: 84 / 255, alpha: 0.5,
	})
	const red = darkBorderComponents({ red: 1, green: 0, blue: 0, alpha: 1 })
	assert.ok(Math.abs(red.red - 0.67) < 1e-9 && red.green === 0 && red.blue === 0 && red.alpha === 1)
	assert.deepEqual(darkBorderComponents({ red: 0.2, green: 0.1, blue: 0.05, alpha: 1 }), {
		red: 0, green: 0, blue: 0, alpha: 1,
	})
})

const WIDTHS = { top: 8, right: 4, bottom: 12, left: 6 }
function assertPoints(actual: [number, number][], expected: [number, number][], eps = 1e-9) {
	assert.equal(actual.length, expected.length)
	for (let i = 0; i < actual.length; i++) {
		assert.ok(
			Math.abs(actual[i][0] - expected[i][0]) < eps && Math.abs(actual[i][1] - expected[i][1]) < eps,
			`point ${i}: ${actual[i]} ≠ ${expected[i]}`,
		)
	}
}

test('borderBandPoints(0,1) reproduces the original side trapezoids with unequal widths', () => {
	assertPoints(borderBandPoints('top', 100, 60, WIDTHS, 0, 1), [[0, 60], [100, 60], [96, 52], [6, 52]])
	assertPoints(borderBandPoints('right', 100, 60, WIDTHS, 0, 1), [[100, 60], [100, 0], [96, 12], [96, 52]])
	assertPoints(borderBandPoints('bottom', 100, 60, WIDTHS, 0, 1), [[100, 0], [0, 0], [6, 12], [96, 12]])
	assertPoints(borderBandPoints('left', 100, 60, WIDTHS, 0, 1), [[0, 0], [0, 60], [6, 52], [6, 12]])
})

test('borderBandPoints splits a double top border into outer and inner third trapezoids', () => {
	assertPoints(borderBandPoints('top', 100, 60, WIDTHS, 0, 1 / 3), [
		[0, 60], [100, 60], [100 - 4 / 3, 60 - 8 / 3], [2, 60 - 8 / 3],
	])
	assertPoints(borderBandPoints('top', 100, 60, WIDTHS, 2 / 3, 1), [
		[4, 60 - 16 / 3], [100 - 8 / 3, 60 - 16 / 3], [96, 52], [6, 52],
	])
})
