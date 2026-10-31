import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeInlineStyle } from '../src/inline-style.ts'

test('inline declarations retain quoted delimiters and duplicate order while converting native numeric units', () => {
	assert.deepEqual(normalizeInlineStyle('width:10px; width:20pt;opacity:.8;font-family:"A; B: C";background-image:url("data:image/svg+xml;a:b");--MySize:2px'), {
		width: 20, opacity: .8, fontFamily: '"A; B: C"', backgroundImage: 'url("data:image/svg+xml;a:b")', '--MySize': '2px',
	})
})
test('array normalization folds recursively without mutating authored styles or prototype fields', () => {
	const base = Object.freeze({ width: 12, color: '#123456' }), nested = Object.freeze([base, null, ['width:24px', { opacity: .5 }]])
	assert.equal(normalizeInlineStyle(base), base)
	assert.deepEqual(normalizeInlineStyle(nested), { width: 24, color: '#123456', opacity: .5 }); assert.equal(base.width, 12)
	const special = normalizeInlineStyle('__proto__:safe;constructor:own')!
	assert.equal(Object.getPrototypeOf(special), Object.prototype); assert.equal(Object.hasOwn(special, '__proto__'), true); assert.equal(special.__proto__, 'safe')
})
test('inline values retain percentages/keywords and follow native no-important-priority ordering', () => {
	assert.deepEqual(normalizeInlineStyle('WIDTH:40%;height:auto;opacity:0.2!important;opacity:0.7'), { width: '40%', height: 'auto', opacity: .7 })
	assert.deepEqual(normalizeInlineStyle(''), {}); assert.equal(normalizeInlineStyle(null), null); assert.equal(normalizeInlineStyle(undefined), undefined)
})
test('invalid style lists and non-style primitives fail before native application', () => {
	for (const value of [12, true, () => {}, 'width', 'a { width: 2px }', '@media screen { a { width:2px } }']) {assert.throws(() => normalizeInlineStyle(value), TypeError)}
})
