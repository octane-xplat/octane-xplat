import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pxToDip } from '../dist/vite.js'

test('box-shadow warns with the native sibling-layer contract, not an inert claim', () => {
  const warnings = []
  const context = { warn: (message) => warnings.push(message) }

  pxToDip().transform.call(context, '.card { box-shadow: 0 2px 10px #00000029; }', '/style.css')

  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /renders on both platforms/)
  assert.match(warnings[0], /transform.*leaves it behind/i)
  assert.doesNotMatch(warnings[0], /inert/)
})

test('sheets without box-shadow stay quiet', () => {
  const warnings = []
  const context = { warn: (message) => warnings.push(message) }

  pxToDip().transform.call(context, '.card { padding: 4px; }', '/style.css')

  assert.equal(warnings.length, 0)
})
