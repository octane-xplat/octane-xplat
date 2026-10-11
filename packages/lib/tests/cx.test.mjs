import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cx } from '../src/cx.ts'

test('joins nested class values for imperative assignments with existing coercion', () => {
	const view = { className: '' }
	view.className = cx('host', [null, ['active', false, ['', undefined]]], 0, NaN)
	assert.equal(view.className, 'host active')
	assert.equal(cx(), '')
	assert.equal(cx(1, true, { active: true }, 'two words'), '1 true [object Object] two words')
})
