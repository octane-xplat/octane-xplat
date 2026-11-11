/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import {
  createNativeGestureContainer,
  NativeGestureView,
  nativeGestureSubscriptions,
} from '../../../tests/native-gesture-object-driver'

import {
  createNativeGestureDriver,
  dispatchFixtureContacts,
} from '../../../tests/native-gesture-surface'

import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import type { InputFrame } from '../../gestures/owner'
import type { PressableProps } from '../../props'
import { Pressable } from './Pressable.tsrx'

// Normalized contact/SDK semantic dispatch, not a native recognizer or OS test.
vi.mock('../../gestures/native-surface', () => import('../../../tests/native-gesture-surface'))
vi.mock('@nativescript/core', () => ({ View: NativeGestureView, isAndroid: true, isIOS: false }))

const roots: { unmount(): void }[] = []

afterEach(() => {
  roots.splice(0).forEach((root) => root.unmount())
})

function setup(props: PressableProps = {}) {
  const container = createNativeGestureContainer()
  const root = createUniversalRoot(container, createNativeGestureDriver(container))

  roots.push(root)

  const render = (value: PressableProps) => flushUniversalSync(() => root.render(Pressable, value))

  render(props)

  const host = container.children[0]
  let time = 0
  const contacts = (
    type: InputFrame['type'],
    y: number,
    count = type === 'up' || type === 'cancel' ? 0 : 1,
  ) => {
    const changed = { id: 'one', kind: 'touch' as const, window: { x: 0, y }, screen: null }
    const current = Array.from({ length: count }, (_, index) => ({
      ...changed,
      id: index === 0 ? 'one' : 'two',
    }))

    flushUniversalSync(() =>
      dispatchFixtureContacts(container, {
        type,
        time: (time += 100),
        changed,
        contacts: current,
        hitPath: [host],
      }),
    )
  }

  const tap = (pointer = true) =>
    container.dispatchEvent(host, 'tap', pointer ? { android: {} } : {})

  return { root, host, container, render, contacts, tap }
}

it('retains a draft after a moving-host pan and ignores its trailing native activation', () => {
  let draft = 'unsaved'
  const onPan = vi.fn()
  const env = setup({
    onPan,
    onPress: () => {
      draft = ''
    },
  })

  env.contacts('down', 0)
  env.contacts('move', 20)
  env.host.translateY = 20
  env.contacts('move', 80)
  env.contacts('up', 80)
  env.tap()
  expect(onPan.mock.calls[0][0].phase).toBe('start')

  const finishes = onPan.mock.calls.filter(([event]) => event.phase === 'finish')

  expect(finishes).toHaveLength(1)
  expect(finishes[0][0].terminal.sample.translation.y).toBe(80)
  expect(draft).toBe('unsaved')
  env.contacts('down', 20)
  env.contacts('up', 20)
  env.tap()
  expect(draft).toBe('')
})

it('keeps tiny jitter and a fresh tap after rejecting a drag', () => {
  const onPress = vi.fn()
  const env = setup({ onPress, onPan: vi.fn() })

  for (const distance of [80, 2, 0]) {
    env.contacts('down', 0)
    env.contacts('move', distance)
    env.contacts('up', distance)
    env.tap()
  }

  expect(onPress).toHaveBeenCalledTimes(2)
})

it('rejects cancelled, multi-contact and returned-to-origin sequences', () => {
  for (const kind of ['cancel', 'multi', 'return']) {
    const onPress = vi.fn(),
      onPressOut = vi.fn()

    const env = setup({ onPress, onPressOut })

    env.contacts('down', 0)
    if (kind === 'cancel') {
      env.contacts('cancel', 0)
    } else if (kind === 'multi') {
      env.contacts('down', 0, 2)
    } else {
      env.contacts('move', 80)
      env.contacts('move', 0)
    }

    env.tap()
    expect(onPress).not.toHaveBeenCalled()
    expect(onPressOut).toHaveBeenCalledOnce()
    env.contacts('up', 0)
    env.contacts('down', 0)
    env.contacts('up', 0)
    env.tap()
    expect(onPress).toHaveBeenCalledOnce()
  }
})

it('does not revive a held contact after disabling or removing its pan owner', () => {
  const onPress = vi.fn(),
    onPan = vi.fn()

  const env = setup({ onPress, onPan })

  env.contacts('down', 0)
  env.render({ onPress, onPan, disabled: true })
  env.render({ onPress, onPan })
  env.contacts('up', 0)
  env.tap()
  expect(onPress).not.toHaveBeenCalled()
  env.contacts('down', 0)
  env.contacts('move', 80)
  env.render({ onPress })
  env.contacts('up', 80)
  env.tap()
  expect(onPress).not.toHaveBeenCalled()
})

it('updates callbacks during a contact and preserves independent virtual activation', async () => {
  const first = vi.fn(),
    latest = vi.fn(),
    onDoublePress = vi.fn()

  const env = setup({ onPress: first, onDoublePress, onPan: vi.fn() })

  env.contacts('down', 0)
  env.render({ onPress: latest, onDoublePress, onPan: vi.fn() })
  env.contacts('up', 0)
  env.tap()
  expect(first).not.toHaveBeenCalled()
  expect(latest).toHaveBeenCalledOnce()
  env.tap(false)
  expect(latest).toHaveBeenCalledTimes(2)
  expect(latest.mock.calls[0][0].source).toBe('pointer')
  expect(latest.mock.calls[1][0].source).toBe('virtual')
  env.contacts('down', 0)
  env.contacts('move', 80)
  env.container.dispatchEvent(env.host, 'doubleTap', { android: {} })
  await Promise.resolve()
  expect(onDoublePress).not.toHaveBeenCalled()
  env.contacts('up', 80)
})

it('keeps independent roots and contacts separate', () => {
  const outerPress = vi.fn(),
    innerPress = vi.fn()

  const outer = setup({ onPress: outerPress, onPan: vi.fn() })
  const inner = setup({ onPress: innerPress })

  outer.contacts('down', 0)
  outer.contacts('move', 80)
  inner.contacts('down', 0)
  inner.contacts('up', 0)
  inner.tap()
  outer.contacts('up', 80)
  outer.tap()
  expect(innerPress).toHaveBeenCalledOnce()
  expect(outerPress).not.toHaveBeenCalled()
})

it('removes SDK semantic subscriptions on unmount', () => {
  const onPress = vi.fn()
  const env = setup({ onPress, onDoublePress: vi.fn() })

  expect(nativeGestureSubscriptions(env.host)).toEqual(['tap', 'doubleTap'])
  env.root.unmount()
  expect(nativeGestureSubscriptions(env.host)).toEqual([])
  expect(() => env.tap()).toThrow(/unknown event target/)
  expect(onPress).not.toHaveBeenCalled()
})
