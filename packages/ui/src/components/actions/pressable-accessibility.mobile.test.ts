import { createNativeGestureContainer as createObjectContainer } from '../../../tests/native-gesture-object-driver'

// Action/layout fixture only: no native input is delivered by the object driver.
vi.mock('../../gestures/host.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

import { describe, expect, it, vi } from 'vitest'
import { createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', async () => ({
  View: (await import('../../../tests/native-gesture-object-driver')).NativeGestureView,
  isIOS: false,
  isAndroid: true,
}))

import { Pressable } from './Pressable.tsrx'

describe('native disabled Pressable accessibility state', () => {
  it('reports disabled ahead of selected/checked and restores state when enabled', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(Pressable, {
      disabled: true,
      accessibilityState: { selected: true, checked: true },
    })

    expect(container.children[0].props.accessibilityState).toBe('disabled')
    root.render(Pressable, {
      disabled: false,
      accessibilityState: { selected: true, checked: true },
    })

    expect(container.children[0].props.accessibilityState).toBe('selected')
    root.unmount()
  })
})
