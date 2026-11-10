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
  ['Windows', useWindowsHost],
  ['GTK', useGtkHost],
] as const)(
  '%s rejects shared attachment rather than registering an inert gesture',
  (platform, useHost) => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    function Surface() {
      const ref = useHost({ onPan() {} })

      return <masonview ref={ref} />
    }

    try {
      expect(() => root.render(Surface, {})).toThrow(`Unsupported gesture attachment: ${platform}`)
    } finally {
      root.unmount()
    }
  },
)
