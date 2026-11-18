/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
} from 'octane/universal/native'

const hosts = vi.hoisted(() => ({ attached: [] as [unknown, any][], registered: [] as unknown[] }))

vi.mock('@nativescript/core', () => ({
  RootLayout: class {
    style: Record<string, unknown> = {}
    on() {}
  },
}))
vi.mock('@octane-xplat/nativescript-octane', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  attachForeignChild: (parent: unknown, child: any) => hosts.attached.push([parent, child]),
  detachForeignChild() {},
}))
vi.mock('./root-layout', () => ({
  registerRootLayout() {},
  unregisterRootLayout() {},
  registerScreenOverlayHost: (shell: unknown) => hosts.registered.push(shell),
  unregisterScreenOverlayHost() {},
}))
vi.mock('../overlays/escape-props', () => ({ applyEscapeProps() {} }))
vi.mock('../../internal/keyboard/tap-to-blur', () => ({ attachTapToBlur() {} }))

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
    // A Mason shell keeps the first screen prerenderable; overlays get a
    // RootLayout attached from the shell ref, outside the rendered tree.
    expect(shell.type).toBe('masonview')
    expect(shell.children).toHaveLength(1)
    expect(hosts.attached).toHaveLength(1)
    const [parent, host] = hosts.attached[0]
    expect(hosts.registered).toEqual([parent])
    expect(host.className).toBe('vx-screen-overlays')
    expect(host.isPassThroughParentEnabled).toBe(true)
    expect(host.style).toMatchObject({ position: 'absolute', width: '100%', height: '100%' })
  } finally {
    root.unmount()
  }
})
