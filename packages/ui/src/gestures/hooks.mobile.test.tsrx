/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { expect, it } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { usePanGesture$ } from './hooks.tsrx'
import { createGestureOwner } from './owner'
import type { PanGesture } from './types'

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
