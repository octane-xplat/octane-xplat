import { expect, it } from 'vitest'
import { applyNativeDrawerProps } from './native-host-props'

it('rejects removed engine settings atomically while forwarding ordinary native host attributes', () => {
  const host = { accessibilityHint: 'old' }

  expect(() =>
    applyNativeDrawerProps(host, { accessibilityHint: 'new', shouldPan: () => true }),
  ).toThrow('shouldPan')

  expect(host.accessibilityHint).toBe('old')
  expect(() =>
    applyNativeDrawerProps(host, { accessibilityHint: 'new', onTouch: () => {} }),
  ).toThrow('onTouch')

  expect(host.accessibilityHint).toBe('old')
  applyNativeDrawerProps(host, { accessibilityHint: 'new' })
  expect(host.accessibilityHint).toBe('new')
})
