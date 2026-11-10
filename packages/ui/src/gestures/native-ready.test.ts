import { expect, it } from 'vitest'
import { nativeInputReady } from './native-ready'
import type { NativeGestureView } from './input.native'

it('waits for a loaded mobile host to enter its OS window', () => {
  let attached = false
  const view: NativeGestureView = {
    nativeViewProtected: { isAttachedToWindow: () => attached },
    style: {},
    on() {},
    off() {},
  }

  expect(nativeInputReady(view)).toBe(false)
  attached = true
  expect(nativeInputReady(view)).toBe(true)

  const ios: NativeGestureView = { ...view, nativeViewProtected: { window: null } }

  expect(nativeInputReady(ios)).toBe(false)
  expect(nativeInputReady({ ...ios, nativeViewProtected: { window: {} } })).toBe(true)
  expect(nativeInputReady({ ...view, isLoaded: false })).toBe(false)
})
