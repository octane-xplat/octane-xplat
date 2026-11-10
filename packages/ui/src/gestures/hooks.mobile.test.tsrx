/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { expect, it } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { usePanGesture$, useInteractionScope$ } from './hooks.tsrx'
import { interactionScopeController } from './scope'
import { createGestureOwner } from './owner'
import type { PanGesture, InteractionScope } from './types'

function Reader(props: { capture(handle: PanGesture): void; start(): void }) @{
  const drag = usePanGesture$({ axis: 'x', onStart: props.start })

  props.capture(drag)

  <label text={String(drag.active$.get())} />
}

function Pair(props: {
  captureFirst(handle: PanGesture): void
  captureSecond(handle: PanGesture): void
  start(): void
}) @{
  <masonview>
    <Reader capture={props.captureFirst} start={props.start} />
    <Reader capture={props.captureSecond} start={props.start} />
  </masonview>
}

it('isolates hook-owned signals, rerenders native readers and retains the handle during its own updates', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const first: PanGesture[] = [],
    second: PanGesture[] = [],
    calls: string[] = []

  const owner = createGestureOwner({
    frame: () => () => {},
    error: (error) => {
      throw error
    },
  })

  const host = {}

  try {
    const captureFirst = (handle: PanGesture) => {
      first.push(handle)
    }

    const captureSecond = (handle: PanGesture) => {
      second.push(handle)
    }

    flushUniversalSync(() =>
      root.render(Pair, { captureFirst, captureSecond, start: () => calls.push('old') }),
    )

    const gesture = first[0]

    owner.register(host, gesture, {
      target: { id: 'native-object-host' },
      local: (p) => p,
      freeze: () => (p) => p,
    })

    flushUniversalSync(() =>
      owner.dispatch({
        type: 'down',
        time: 0,
        contacts: [{ id: '1', kind: 'touch', window: { x: 0, y: 0 }, screen: null }],
        changed: { id: '1', kind: 'touch', window: { x: 0, y: 0 }, screen: null },
        hitPath: [host],
      }),
    )

    flushUniversalSync(() =>
      root.render(Pair, { captureFirst, captureSecond, start: () => calls.push('new') }),
    )

    flushUniversalSync(() =>
      owner.dispatch({
        type: 'move',
        time: 20,
        contacts: [{ id: '1', kind: 'touch', window: { x: 20, y: 0 }, screen: null }],
        changed: { id: '1', kind: 'touch', window: { x: 20, y: 0 }, screen: null },
        hitPath: [host],
      }),
    )

    expect(calls).toEqual(['new'])
    expect(first.every((handle) => handle === gesture)).toBe(true)
    expect(second[0]).not.toBe(gesture)
    expect(second[0].active$.get()).toBe(false)
    expect(container.children[0].children.map((child) => child.props.text)).toEqual([
      'true',
      'false',
    ])

    flushUniversalSync(() => root.unmount())
    expect(() => gesture.active$.get()).toThrow()
  } finally {
    owner.dispose()
    root.unmount()
  }
})

function ScopeReader(props: { capture(scope: InteractionScope): void }) @{
  const scope = useInteractionScope$()

  props.capture(scope)

  <label text={String(scope.suspended$.get())} />
}

it('retires both unused scopes and active suspension leases before native effect cleanup', () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const handles: InteractionScope[] = []
  let restored = 0

  try {
    flushUniversalSync(() =>
      root.render(ScopeReader, {
        capture: (scope) => {
          handles.push(scope)
        },
      }),
    )

    flushUniversalSync(() => root.unmount())
    expect(handles[0].suspend()).toEqual({ ok: false, reason: 'detached' })
  } finally {
    root.unmount()
  }

  const activeRoot = createUniversalRoot(container, createObjectDriver('nativescript'))

  try {
    flushUniversalSync(() =>
      activeRoot.render(ScopeReader, {
        capture: (scope) => {
          handles.push(scope)
        },
      }),
    )

    const scope = handles.at(-1)!

    interactionScopeController(scope).attach({
      freeze() {
        return {
          ok: true,
          release() {
            restored++
          },
        }
      },
    })

    const result = scope.suspend()

    expect(result.ok).toBe(true)
    flushUniversalSync(() => {})
    expect(container.children[0].props.text).toBe('true')
    flushUniversalSync(() => activeRoot.unmount())
    expect(restored).toBe(1)
    if (result.ok) {
      result.lease.release()
    }

    expect(restored).toBe(1)
  } finally {
    activeRoot.unmount()
  }
})

it('cancels and finalizes before reporting a native callback error through the renderer boundary', async () => {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  let handle: PanGesture | null = null
  const calls: string[] = []
  function Broken() {
    handle = usePanGesture$({
      axis: 'x',
      onStart() {
        calls.push('start')
        throw new Error('Native drag failed')
      },
      onCancel() {
        calls.push('cancel')
      },
      onFinalize() {
        calls.push('finalize')
      },
    })

    return <label text="Ready" />
  }

  function Boundary() @{
    @try {
      <Broken />
    } @catch (error) {
      <label text={String(error)} />
    }
  }

  const owner = createGestureOwner({
    frame: () => () => {},
    error: (error) => {
      throw error
    },
  })

  const host = {}

  try {
    flushUniversalSync(() => root.render(Boundary, {}))
    owner.register(host, handle!, {
      target: { id: 'test' },
      local: (p) => p,
      freeze: () => (p) => p,
    })

    const contact = (x: number) => ({
      id: '1',
      kind: 'touch' as const,
      window: { x, y: 0 },
      screen: null,
    })

    owner.dispatch({
      type: 'down',
      time: 0,
      contacts: [contact(0)],
      changed: contact(0),
      hitPath: [host],
    })

    owner.dispatch({
      type: 'move',
      time: 20,
      contacts: [contact(20)],
      changed: contact(20),
      hitPath: [host],
    })

    expect(calls).toEqual(['start', 'cancel', 'finalize'])
    await new Promise((resolve) => setTimeout(resolve, 0))
    flushUniversalSync(() => {})
    expect(container.children[0].props.text).toContain('Native drag failed')
  } finally {
    owner.dispose()
    root.unmount()
  }
})
