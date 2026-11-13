import assert from 'node:assert/strict'
import test from 'node:test'
import { cx } from '../src/cx.ts'

test('joins nested class values for imperative assignments', () => {
  const view = { className: '' }
  view.className = cx('host', [null, ['active', false, ['', undefined]]], 0, NaN)
  assert.equal(view.className, 'host active')
  assert.equal(cx(), '')
  assert.equal(cx(1, true, { active: true }, 'two words'), '1 active two words')
})

test('native class composition accepts nested arrays and conditional class records', () => {
  const classes = Object.freeze(['viewport', Object.freeze({ active: true, hidden: false })])
  assert.equal(cx('vx-scrollable', [classes, null, undefined, false]), 'vx-scrollable viewport active')
  assert.equal(cx('base', { flex: true, grid: false }), 'base flex')
  assert.equal(cx('base', { flex: false, grid: true }), 'base grid')
  assert.equal(cx('base', { flex: false, grid: false }), 'base')
})

test('class composition keeps strings and truthy numbers without inventing boolean classes', () => {
  assert.equal(cx('one two', ['', 0, NaN, true, false], 4, 'one'), 'one two 4 one')
  assert.equal(cx({ inherited: 0, selected: 'yes', disabled: null }), 'selected')
})
