/** @jsxImportSource @octane-xplat/jsx */
import { createNativeGestureContainer as createObjectContainer } from '../../../tests/native-gesture-object-driver'
// Action/layout fixture only: no native input is delivered by the object driver.
vi.mock('../../gestures/host.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

import { dispatchTestInput } from '../../../tests/interaction-host-mock.tsrx'
import { describe, expect, it, vi } from 'vitest'
import { createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', async () => ({
  View: (await import('../../../tests/native-gesture-object-driver')).NativeGestureView,
  isIOS: false,
  isAndroid: true,
  ScrollView: class ScrollView {},
  Application: {},
  Utils: { openUrl: () => {} },
}))

// Icon's leaf imports the svg router for icon markup; string icons are not
// exercised here, so stub the router module out.
vi.mock('../media/svg', () => ({
  glyphSvgMarkup: () => null,
  isSvgSrc: () => false,
  svgSource: (src: string) => src,
}))

// The loading swap renders ActivityIndicator, whose ref drives NS view
// animation the object driver does not implement; swap in a compiled no-op.
vi.mock('../feedback/ActivityIndicator.tsrx', async () => ({
  ActivityIndicator: (await import('../layout/Spacer.tsrx')).Spacer,
}))

import { Button } from './Button.tsrx'

describe('native button action failure reporting', () => {
  it('reports a rejected pressAction through onActionError', async () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    const error = new Error('save failed')
    const onActionError = vi.fn()
    let rejectAction: ((reason: unknown) => void) | undefined

    root.render(Button, {
      label: 'Save',
      pressAction: () =>
        new Promise<void>((_, reject) => {
          rejectAction = reject
        }),
      onActionError,
    })

    const host = container.children[0]

    dispatchTestInput(container, host, 'tap', {})

    rejectAction!(error)
    await Promise.resolve()
    await Promise.resolve()
    expect(onActionError).toHaveBeenCalledWith(error)
    root.unmount()
  })

  it('reports a synchronous pressAction throw through onActionError', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    const error = new Error('sync failure')
    const onActionError = vi.fn()

    root.render(Button, {
      label: 'Save',
      pressAction: () => {
        throw error
      },
      onActionError,
    })

    dispatchTestInput(container, container.children[0], 'tap', {})
    expect(onActionError).toHaveBeenCalledWith(error)
    root.unmount()
  })
})

it('runs a native synchronous effect before navigation and lets it prevent the action', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const action = vi.fn(async () => {})
  const effects: string[] = []

  root.render(Button, {
    label: 'Save',
    href: 'https://example.com',
    onPress: (event) => {
      effects.push(event.source)
      event.preventDefault()
    },
    pressAction: action,
  })

  try {
    dispatchTestInput(container, container.children[0], 'tap', {})
    expect(effects).toEqual(['virtual'])
    expect(action).not.toHaveBeenCalled()
  } finally {
    root.unmount()
  }
})

it('releases native admission after a synchronous effect throws and never starts its action', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const action = vi.fn(async () => {})
  let calls = 0

  root.render(Button, {
    label: 'Save',
    onPress: () => {
      if (++calls === 1) {
        throw new Error('Effect failed')
      }
    },
    pressAction: action,
  })

  try {
    expect(() => dispatchTestInput(container, container.children[0], 'tap', {})).toThrow(
      'Effect failed',
    )

    expect(action).not.toHaveBeenCalled()
    dispatchTestInput(container, container.children[0], 'tap', {})
    expect(calls).toBe(2)
    expect(action).toHaveBeenCalledTimes(1)
  } finally {
    root.unmount()
  }
})
