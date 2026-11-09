/** @jsxImportSource @octane-xplat/jsx */
import { derived$ } from 'octane/signals'
import { afterEach, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { useMediaQuery$ } from './use-media-query.macos.tsrx'
import { useBreakpoints$ } from '../../../../platform/src/breakpoints.macos.tsrx'
import { useWindowSize$ } from '../../../../platform/src/screen.macos.tsrx'

const native = vi.hoisted(() => ({
  host: {
    windowSize: { width: 600, height: 400, orientation: 'landscape' as const },
    onWindowResize: (notify: () => void) => {
      native.listeners.add(notify)
      return () => native.listeners.delete(notify)
    },
  },
  listeners: new Set<() => void>(),
}))

vi.mock('./host-bridge', () => ({ appKitHost: () => native.host }))
afterEach(() => {
  native.listeners.clear()
  vi.unstubAllGlobals()
})

function Reader(props: { values: string[] }) @{
  const size$ = useWindowSize$()
  const matches$ = useBreakpoints$({ wide: 800 })
  const media$ = useMediaQuery$('(min-width: 800px)')
  const label$ = derived$(() => `${size$.get().width}/${matches$.get().wide}/${media$.get()}`)

  props.values.push(label$.get())

  <label text={label$.get()} />
}

it('tracks AppKit source notifications through composed signals and releases subscriptions', async () => {
  vi.stubGlobal('__xplatAppKit', native.host)

  const root = createUniversalRoot(
    createObjectContainer('nativescript'),
    createObjectDriver('nativescript'),
  )

  const values: string[] = []

  try {
    flushUniversalSync(() => root.render(Reader, { values }))
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(native.listeners.size).toBeGreaterThan(0)
    expect(values.at(-1)).toBe('600/false/false')
    flushUniversalSync(() => {
      native.host.windowSize = { width: 1000, height: 500, orientation: 'landscape' }
      for (const notify of native.listeners) {
        notify()
      }
    })

    expect(values.at(-1)).toBe('1000/true/true')
  } finally {
    root.unmount()
  }

  expect(native.listeners.size).toBe(0)
})
