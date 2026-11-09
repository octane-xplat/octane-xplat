import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adapt, compileTailwind, declarations, scenarios } from './compare.ts'

test('the pinned official compiler generates the complete corpus without Preflight', async () => {
  const { css } = await compileTailwind()

  for (const selector of [
    '.flex',
    '.grid',
    '.gap-4',
    '.max-w-32',
    '.invisible',
    '.translate-x-4',
  ]) {
    assert.ok(declarations(css, selector).length, `missing ${selector}`)
  }

  assert.doesNotMatch(css, /box-sizing:border-box/)
})

test('the released adapter retains the earlier repaired properties', async () => {
  const css = '.a { gap: 16px; max-width: 20px; white-space: nowrap; visibility: hidden }'
  const result = await adapt(css)

  for (const declaration of [
    'gap:16px',
    'max-width:20px',
    'white-space:nowrap',
    'visibility:hidden',
  ]) {
    assert.ok(declarations(result.css, '.a').includes(declaration), declaration)
  }
})

test('the native engine baseline preserves ordinary layer order', async () => {
  const { nativeOpacity } = await import('./native-engine.ts')

  assert.equal(nativeOpacity(scenarios[0].css, ['a', 'b']), '0.75')
})
