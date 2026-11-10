/** @jsxImportSource @octane-xplat/jsx */
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
} from 'octane/universal/native'

import { expect, it } from 'vitest'
import { useInteractionHost as useWindowsHost } from './host.windows.tsrx'
import { useInteractionHost as useGtkHost } from './host.gtk.tsrx'

it.each([
  ['Windows', useWindowsHost, 'Native gesture attachment requires a NativeScript view'],
  ['GTK', useGtkHost, 'Unsupported GTK gesture attachment: raw mouse input bridge unavailable'],
] as const)(
  '%s rejects attachment when its qualified bridge is unavailable',
  (_platform, useHost, diagnostic) => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    function Surface() {
      const ref = useHost({ onPan() {} })

      return <masonview ref={ref} />
    }

    try {
      expect(() => root.render(Surface, {})).toThrow(diagnostic)
    } finally {
      root.unmount()
    }
  },
)
