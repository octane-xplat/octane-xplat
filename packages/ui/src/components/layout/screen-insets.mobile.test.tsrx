/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
} from 'octane/universal/native'

const tapBlur = vi.hoisted(() => ({ attached: [] as any[], detached: [] as any[] }))

vi.mock('./root-layout', () => ({ registerRootLayout() {}, unregisterRootLayout() {} }))
vi.mock('@octane-xplat/lib/escape-props', () => ({ applyEscapeProps() {} }))
vi.mock('../../internal/platform/ui-host-props', () => ({ prepareUIHost() {}, applyUIHostModifiers() {} }))
vi.mock('../../internal/accessibility/native-accessibility', () => ({ applyEscapeProps() {} }))
vi.mock('../../internal/keyboard/tap-to-blur', () => ({
  attachTapToBlur: (v: any) => {
    tapBlur.attached.push(v)
    return () => tapBlur.detached.push(v)
  },
}))

import { Screen } from './Screen.tsrx'

it('leaves safe-area ownership to the host and SafeArea from the first render', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  root.render(Screen as any, { id: 'first-screen' })
  try {
    const shell = container.children[0]

    expect(shell.props.id).toBe('first-screen')
    expect(shell.props.iosIgnoreSafeArea).toBe(true)
    expect(shell.children[0].props.iosIgnoreSafeArea).toBe(true)
  } finally {
    root.unmount()
  }
})

it('attaches tap-to-blur once per content view and detaches on unmount', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  tapBlur.attached.length = 0
  tapBlur.detached.length = 0

  root.render(Screen as any, { id: 'tap-blur-screen' })

  const inner = container.children[0].children[0]

  expect(tapBlur.attached).toEqual([inner])

  // A re-render keeps the same ref identity and view — no re-attach.
  root.render(Screen as any, { id: 'tap-blur-screen', className: 'extra' })
  expect(tapBlur.attached).toEqual([inner])
  expect(tapBlur.detached).toEqual([])

  root.unmount()
  expect(tapBlur.detached).toEqual([inner])
})
