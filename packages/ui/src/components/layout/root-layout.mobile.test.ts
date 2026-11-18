import { expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
  RootLayout: class {
    parent: unknown
  },
  getRootLayout: () => undefined,
}))

import { RootLayout } from '@nativescript/core'
import {
  registerRootLayout,
  registerScreenOverlayHost,
  rootLayoutFor,
  unregisterRootLayout,
  unregisterScreenOverlayHost,
} from './root-layout'

it('resolves a Screen shell to its overlay host and an overlay to its RootLayout', () => {
  const shell = { parent: null }
  const host = new (RootLayout as any)()
  host.parent = shell
  const content = { parent: shell }
  const leaf = { parent: content }
  const overlay = { parent: host }
  const inOverlay = { parent: overlay }

  registerScreenOverlayHost(shell, host)
  registerRootLayout(host)
  try {
    expect(rootLayoutFor(leaf)).toBe(host)
    expect(rootLayoutFor(inOverlay)).toBe(host)
    unregisterScreenOverlayHost(shell)
    unregisterRootLayout(host)
    expect(rootLayoutFor(leaf)).toBeUndefined()
  } finally {
    unregisterScreenOverlayHost(shell)
    unregisterRootLayout(host)
  }
})
