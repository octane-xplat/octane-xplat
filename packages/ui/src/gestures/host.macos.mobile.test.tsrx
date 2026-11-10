/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { usePanGesture$ } from './hooks.tsrx'
import { useInteractionHost } from './host.macos.tsrx'
import type { HostGestureBridge } from './input.host'
import type { InputFrame } from './owner'

function Panel(props: { start(): void }) @{
  const pan = usePanGesture$({ axis: 'x', samples: 'input', onStart: props.start })
  const bind = useInteractionHost({ gestures: pan })

  <masonview ref={bind} />
}

it('keeps the AppKit host observer stable through rerenders and releases it on unmount', () => {
  const nativeRoot = {}
  const observers = new Set<(frame: InputFrame, identity: string) => void>()
  let attachments = 0
  const bridge: HostGestureBridge = {
    gestureSurface(host) {
      return {
        root: nativeRoot,
        host,
        local: (point) => point,
        containsPoint: () => true,
        containsHost: (other) => other === host,
        observe(observer) {
          attachments++
          observers.add(observer)
          return () => {
            observers.delete(observer)
          }
        },
      }
    },
  }

  vi.stubGlobal('__xplatAppKit', bridge)

  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const calls: string[] = []
  let serial = 0
  const send = (type: InputFrame['type'], x: number) => {
    const changed = { id: '1', kind: 'mouse' as const, window: { x, y: 0 }, screen: null }
    const frame: InputFrame = {
      type,
      time: ++serial * 10,
      changed,
      contacts: type === 'up' ? [] : [changed],
      hitPath: [container.children[0]],
    }

    flushUniversalSync(() => {
      for (const observe of [...observers]) {
        observe(frame, String(serial))
      }
    })
  }

  try {
    flushUniversalSync(() => root.render(Panel, { start: () => calls.push('old') }))
    send('down', 0)
    flushUniversalSync(() => root.render(Panel, { start: () => calls.push('new') }))
    send('move', 30)
    expect(calls).toEqual(['new'])
    expect(attachments).toBe(1)
    flushUniversalSync(() => root.unmount())
    expect(observers.size).toBe(0)
  } finally {
    root.unmount()
    vi.unstubAllGlobals()
  }
})
