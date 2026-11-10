/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { useState } from 'octane'
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

function Convenience(props: {
  onPan?: (event: import('./types').GestureNotification<import('./types').PanSample>) => void
}) @{
  const bind = useInteractionHost({ onPan: props.onPan })

  <masonview ref={(host: object | null) => bind(host ? harness.host : null)} />
}

it('allocates callback convenience input after commit, updates handlers without observer churn and finalizes removal once', () => {
  const root = createUniversalRoot(
    createObjectContainer('nativescript'),
    createObjectDriver('nativescript'),
  )

  const calls: string[] = []
  const observed = harness.observed
  const newest = (event: import('./types').GestureNotification<import('./types').PanSample>) => {
    calls.push('newest:' + event.phase)
  }

  const current = (event: import('./types').GestureNotification<import('./types').PanSample>) => {
    calls.push('current:' + event.phase)
  }

  const send = (type: InputFrame['type'], time: number, x: number) => {
    const point = { id: '1', kind: 'touch' as const, window: { x, y: 0 }, screen: null }

    harness.listeners.get(harness.host)?.(
      {
        type,
        time,
        contacts: type === 'up' ? [] : [point],
        changed: point,
        hitPath: [harness.host],
      },
      String(time),
    )
  }

  try {
    flushUniversalSync(() =>
      root.render(Convenience, {
        onPan: (event) => {
          calls.push('old:' + event.phase)
        },
      }),
    )

    send('down', 0, 0)
    send('move', 20, 20)
    flushUniversalSync(() => root.render(Convenience, { onPan: current }))
    send('move', 40, 30)
    expect(harness.observed - observed).toBe(1)
    expect(calls).toContain('current:update')
    flushUniversalSync(() => root.render(Convenience, {}))
    expect(calls.filter((call) => call === 'current:finish')).toHaveLength(1)
    flushUniversalSync(() => root.render(Convenience, { onPan: newest }))
    send('up', 60, 30)
    send('down', 80, 0)
    send('move', 100, 20)
    expect(calls).toContain('newest:start')
  } finally {
    root.unmount()
  }
})

function Scheduled(props: {
  onPan?: (event: import('./types').GestureNotification<import('./types').PanSample>) => void
  replacement: (event: import('./types').GestureNotification<import('./types').PanSample>) => void
  capture(update: () => void): void
}) @{
  const [replaced, setReplaced] = useState(false)

  props.capture(() => setReplaced(true))

  const bind = useInteractionHost({ onPan: replaced ? props.replacement : props.onPan })

  <masonview ref={(host: object | null) => bind(host ? harness.host : null)} />
}

it('allows a cancellation callback to schedule a normal component update during native commit', async () => {
  const root = createUniversalRoot(
    createObjectContainer('nativescript'),
    createObjectDriver('nativescript'),
  )

  const calls: string[] = []
  let replace = () => {},
    armed = true

  const capture = (update: () => void) => {
    replace = update
  }

  const replacement = (
    event: import('./types').GestureNotification<import('./types').PanSample>,
  ) => {
    calls.push('new:' + event.phase)
  }

  const original = (event: import('./types').GestureNotification<import('./types').PanSample>) => {
    if (event.phase === 'finish' && armed) {
      armed = false
      replace()
    }
  }

  const send = (type: InputFrame['type'], time: number, x: number) => {
    const point = { id: '1', kind: 'touch' as const, window: { x, y: 0 }, screen: null }

    harness.listeners.get(harness.host)?.(
      {
        type,
        time,
        contacts: type === 'up' ? [] : [point],
        changed: point,
        hitPath: [harness.host],
      },
      String(time),
    )
  }

  try {
    flushUniversalSync(() => root.render(Scheduled, { onPan: original, replacement, capture }))
    send('down', 0, 0)
    send('move', 20, 20)
    flushUniversalSync(() => root.render(Scheduled, { replacement, capture }))
    await new Promise((resolve) => setTimeout(resolve, 0))
    send('up', 40, 20)
    send('down', 60, 0)
    send('move', 80, 20)
    expect(calls).toContain('new:start')
  } finally {
    root.unmount()
  }
})
