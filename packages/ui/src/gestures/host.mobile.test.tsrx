/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import type { InputFrame } from './owner'
import type { NativeGestureView } from './input.native'
import { useInteractionHost } from './host.tsrx'
import { usePanGesture$ } from './hooks.tsrx'
import { interactionTarget } from './target'

const harness = vi.hoisted(() => ({
  root: {},
  host: {
    nativeViewProtected: {},
    style: { touchAction: 'auto' },
    isLoaded: true,
    on() {},
    off() {},
  },
  observed: 0,
  unobserved: 0,
  listeners: new Map<object, (frame: InputFrame, identity: string) => void>(),
}))

vi.mock('@nativescript/core', () => ({ View: class {} }))
vi.mock('./native-surface', () => ({
  nativeGestureSurface(view: NativeGestureView) {
    return {
      root: harness.root,
      host: view,
      space: {
        target: interactionTarget(view),
        local: (point: { x: number; y: number }) => point,
        freeze: () => (point: { x: number; y: number }) => point,
      },
      scheduler: {
        frame: () => () => {},
        error(error: unknown) {
          throw error
        },
      },
      reserve: () => () => {},
      observe(listener: (frame: InputFrame, identity: string) => void) {
        harness.observed++
        harness.listeners.set(view, listener)
        return () => {
          harness.unobserved++
          harness.listeners.delete(view)
        }
      },
    }
  },
}))

function Managed(props: { start(): void; capture(host: NativeGestureView): void }) @{
  const drag = usePanGesture$({ axis: 'x', onStart: props.start })
  const bind = useInteractionHost({ gestures: drag })

  <masonview
    ref={(host: NativeGestureView | null) => {
      bind(host ? harness.host : null)
      if (host) {
        props.capture(harness.host)
      }
    }}
  />
}

it('keeps the compiled native host observer through callback updates and cleans up its active contact on unmount', () => {
  const container = createObjectContainer('nativescript'),
    root = createUniversalRoot(container, createObjectDriver('nativescript'))

  const calls: string[] = []
  let host: NativeGestureView | null = null
  const capture = (value: NativeGestureView) => {
    host = value
  }

  const observed = harness.observed,
    unobserved = harness.unobserved

  const send = (type: InputFrame['type'], time: number, x: number) => {
    if (!host) {
      throw new Error('Missing committed host')
    }

    const contact = { id: '1', kind: 'touch' as const, window: { x, y: 0 }, screen: null }

    harness.listeners.get(host)?.(
      { type, time, contacts: type === 'up' ? [] : [contact], changed: contact, hitPath: [host] },
      String(time),
    )
  }

  try {
    flushUniversalSync(() =>
      root.render(Managed, {
        start: () => {
          calls.push('old')
        },
        capture,
      }),
    )

    send('down', 0, 0)
    flushUniversalSync(() =>
      root.render(Managed, {
        start: () => {
          calls.push('new')
        },
        capture,
      }),
    )

    send('move', 20, 20)
    expect(calls).toEqual(['new'])
    expect(harness.observed - observed).toBe(1)
    flushUniversalSync(() => root.unmount())
    expect(harness.unobserved - unobserved).toBe(1)
    expect(harness.listeners.size).toBe(0)
  } finally {
    root.unmount()
  }
})
