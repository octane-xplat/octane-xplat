/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'

const nativeListeners = vi.hoisted(
  () => new WeakMap<object, Map<string, (event: unknown) => void>>(),
)

vi.mock('@nativescript/core', () => ({
  GestureTypes: { tap: 1, doubleTap: 2 },
  View: class {
    addEventListener(type: string, callback: (event: unknown) => void) {
      let listeners = nativeListeners.get(this)

      if (!listeners) {
        listeners = new Map()
        nativeListeners.set(this, listeners)
      }

      listeners.set(type, callback)
    }
    removeEventListener(type: string) {
      nativeListeners.get(this)?.delete(type)
    }
  },
  isAndroid: false,
  isIOS: false,
  ScrollView: class {},
  Utils: { layout: { getDisplayDensity: () => 2.625 } },
}))

import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { Pressable } from './Pressable.tsrx'
import type { PressableProps } from '../../props'

const roots: Array<{ unmount(): void }> = []

afterEach(() => {
  roots.splice(0).forEach((root) => root.unmount())
  vi.unstubAllGlobals()
})

function setup(props: PressableProps = {}) {
  vi.stubGlobal('android', {
    view: { ViewConfiguration: { get: () => ({ getScaledTouchSlop: () => 21 }) } },
  })

  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  roots.push(root)

  const render = (next: PressableProps) => flushUniversalSync(() => root.render(Pressable, next))

  render(props)

  const host = container.children[0]
  const dispatch = (name: string, data: object) =>
    flushUniversalSync(() => {
      if (name === 'tap' || name === 'doubleTap') {
        const handler = nativeListeners.get(host)?.get(name)

        if (handler) {
          handler(data)
        } else {
          container.dispatchEvent(host, name, data)
        }
      } else {
        container.dispatchEvent(host, name, data)
      }
    })

  return { render, dispatch, root, host, container }
}

function motion(action: number, rawY: number, downTime = 100) {
  return {
    getActionMasked: () => action,
    getRawX: () => 540,
    getRawY: () => rawY,
    getDownTime: () => downTime,
    getPointerCount: () => 1,
  }
}

it('retains a draft after a slow moving-host pan even when Android emits tap', () => {
  let draft = 'unsaved'
  const onPan = vi.fn()
  const { dispatch } = setup({
    onPan,
    onPress: () => {
      draft = ''
    },
  })

  dispatch('touch', { action: 'down', android: motion(0, 321), view: { _context: {} } })
  for (const [rawY, localY, dy] of [
    [322, 62, 0.4],
    [350, 68, 11.2],
    [395, 70, 28.3],
  ]) {
    const event = { ...motion(2, rawY), getY: () => localY }

    dispatch('touch', { action: 'move', android: event })
    dispatch('pan', { state: 2, deltaX: 0, deltaY: dy, android: { current: event } })
  }

  dispatch('pan', { state: 3, deltaX: 0, deltaY: 28.3, android: { current: motion(1, 401) } })
  dispatch('tap', { android: motion(1, 401) }) // can precede touch-up observer
  dispatch('touch', { action: 'up', android: motion(1, 401) })
  expect(onPan).toHaveBeenCalledTimes(4)
  expect(draft).toBe('unsaved')
})

it('keeps ordinary taps and tiny pan jitter, and accepts the next contact after a rejected drag', () => {
  const onPress = vi.fn()
  const { dispatch } = setup({ onPress, onPan: vi.fn() })

  for (const [time, travel] of [
    [100, 80],
    [200, 2],
    [300, 0],
  ]) {
    dispatch('touch', { action: 'down', android: motion(0, 321, time), view: { _context: {} } })
    dispatch('touch', { action: 'move', android: motion(2, 321 + travel, time) })
    dispatch('pan', {
      state: 1,
      deltaX: 0,
      deltaY: travel,
      android: { current: motion(2, 321 + travel, time) },
    })

    dispatch('touch', { action: 'up', android: motion(1, 321 + travel, time) })
    dispatch('tap', { android: motion(1, 321 + travel, time) })
  }

  expect(onPress).toHaveBeenCalledTimes(2)
})

it('rejects cancelled, multi-contact, and returned-to-origin contacts without affecting the next tap', () => {
  for (const kind of ['cancel', 'multi', 'return']) {
    const onPress = vi.fn()
    const onPressOut = vi.fn()
    const { dispatch } = setup({ onPress, onPressOut })

    dispatch('touch', { action: 'down', android: motion(0, 321), view: { _context: {} } })
    dispatch('touch', {
      action: kind === 'cancel' ? 'cancel' : 'move',
      android: {
        ...motion(kind === 'cancel' ? 3 : 2, kind === 'return' ? 401 : 321),
        getPointerCount: () => (kind === 'multi' ? 2 : 1),
      },
    })

    dispatch('tap', { android: motion(1, 321) })
    expect(onPress).not.toHaveBeenCalled()
    if (kind === 'cancel') {
      expect(onPressOut).toHaveBeenCalledOnce()
    }
  }
})

it('does not activate an old contact after disabling or removing its pan owner', () => {
  const onPress = vi.fn()
  const pan = vi.fn()
  const { dispatch, render } = setup({ onPress, onPan: pan })

  dispatch('touch', { action: 'down', android: motion(0, 321), view: { _context: {} } })
  render({ onPress, disabled: true, onPan: pan })
  render({ onPress, onPan: pan })
  dispatch('tap', { android: motion(1, 321) })
  expect(onPress).not.toHaveBeenCalled()
  dispatch('touch', { action: 'down', android: motion(0, 321, 200), view: { _context: {} } })
  render({ onPress })
  dispatch('tap', { android: motion(1, 321, 200) })
  expect(onPress).not.toHaveBeenCalled()
})

it('reads new callbacks without cancelling a held contact, and retains iOS/accessibility activation', () => {
  const first = vi.fn(),
    latest = vi.fn(),
    onDoublePress = vi.fn()

  const { dispatch, render } = setup({ onPress: first, onDoublePress, onPan: vi.fn() })

  dispatch('touch', { action: 'down', android: motion(0, 321), view: { _context: {} } })
  render({ onPress: latest, onDoublePress, onPan: vi.fn() })
  dispatch('tap', { android: motion(1, 321) })
  expect(first).not.toHaveBeenCalled()
  expect(latest).toHaveBeenCalledOnce()
  dispatch('touch', { action: 'move', android: motion(2, 401) })
  dispatch('doubleTap', { android: motion(1, 401) })
  expect(onDoublePress).not.toHaveBeenCalled()
  dispatch('tap', { ios: {} })
  dispatch('tap', {})
  expect(latest).toHaveBeenCalledTimes(3)
})

it('keeps contact ownership separate for independent mounted controls', () => {
  const outerPress = vi.fn(),
    innerPress = vi.fn()

  const outer = setup({ onPress: outerPress, onPan: vi.fn() })
  const inner = setup({ onPress: innerPress })

  outer.dispatch('touch', { action: 'down', android: motion(0, 321), view: { _context: {} } })
  outer.dispatch('touch', { action: 'move', android: motion(2, 401) })
  inner.dispatch('touch', { action: 'down', android: motion(0, 401, 200), view: { _context: {} } })
  inner.dispatch('tap', { android: motion(1, 401, 200) })
  outer.dispatch('tap', { android: motion(1, 401) })
  expect(innerPress).toHaveBeenCalledOnce()
  expect(outerPress).not.toHaveBeenCalled()
})

it('binds the NativeScript base gesture channel and removes it on unmount', () => {
  const { root, host, container } = setup({ onPress: vi.fn(), onDoublePress: vi.fn() })

  expect([...nativeListeners.get(host)!.keys()]).toEqual(['tap', 'doubleTap'])
  // Mason maps a string tap subscription to click with no contact metadata.
  expect(() => container.dispatchEvent(host, 'tap', { type: 'click' })).toThrow(/no "tap" listener/)
  root.unmount()
  expect(nativeListeners.get(host)?.size).toBe(0)
})
