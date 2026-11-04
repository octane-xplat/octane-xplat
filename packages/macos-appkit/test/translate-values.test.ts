import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { createTransformPaint } = await import('../src/transform-paint.ts')
hooks.deregister()
const transform = createTransformPaint({
  borderPaint: { syncBorderBox() {} },
  shadowPaint: { syncBoxShadow() {} },
  backgroundPaint: { paintBackgrounds() {} },
})

test('percent translations already normalized by the CSS engine survive AppKit input conversion', () => {
  assert.deepEqual(transform.translateAxisValue({ value: 0.25, unit: '%' }), { value: 0.25, unit: '%' })
  assert.deepEqual(transform.translateAxisValue('-50%'), { value: -0.5, unit: '%' })
  assert.equal(transform.translateAxisValue({ value: NaN, unit: '%' }), 0)
})

test('normalized percent longhands retain geometry observation even without radii or shadows', () => {
  const node: any = { transformSpec: { translateX: { value: 0.25, unit: '%' } } }
  assert.equal(transform.hasPercentTranslate(node), true)
  node.transformSpec = { translateY: { value: -0.5, unit: '%' } }
  assert.equal(transform.hasPercentTranslate(node), true)
  node.transformSpec = { translateX: 10 }
  assert.equal(transform.hasPercentTranslate(node), false)
})
