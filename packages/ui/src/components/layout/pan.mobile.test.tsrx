/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
  Utils: { layout: { getDisplayDensity: () => 2 } },
}))

import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { usePan } from './pan.tsrx'
import type { PanEvent } from '../../props'
import { useState } from 'octane'

const events: PanEvent[] = []

function PanHost() @{
  const onPan = usePan((event) => events.push(event))

  <masonview id="pan-host" onPan={onPan} style={{ display: 'flex' }} />
}

function mountPanHost() {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  root.render(PanHost, {})
  return { container, root, host: container.children[0] }
}

function nativeEvent(action: number) {
  return { getActionMasked: () => action }
}

function tracker() {
  return {
    addMovement: vi.fn(),
    computeCurrentVelocity: vi.fn(),
    getXVelocity: () => 800,
    getYVelocity: () => -240,
    recycle: vi.fn(),
  }
}

function installAndroid(trackerInstance: ReturnType<typeof tracker>) {
  vi.stubGlobal('android', {
    view: {
      MotionEvent: { ACTION_CANCEL: 3 },
      VelocityTracker: { obtain: () => trackerInstance },
    },
  })
}

afterEach(() => {
  events.length = 0
  vi.unstubAllGlobals()
})

describe('native pan normalization', () => {
  it('preserves Android ACTION_CANCEL as cancelled and clears release velocity', () => {
    const velocityTracker = tracker()

    installAndroid(velocityTracker)

    const { container, root, host } = mountPanHost()
    const target = { id: 'native-pan-target' }

    container.dispatchEvent(host, 'pan', {
      state: 1,
      deltaX: 0,
      deltaY: 0,
      android: { current: nativeEvent(2) },
      view: target,
    })

    container.dispatchEvent(host, 'pan', {
      // NativeScript's Android pan recognizer reports ended for both
      // ACTION_UP and ACTION_CANCEL; the MotionEvent disambiguates them.
      state: 3,
      deltaX: 40,
      deltaY: 0,
      android: { current: nativeEvent(3) },
      view: target,
    })

    expect(events.map((event) => event.state)).toEqual(['began', 'cancelled'])
    expect(events[1]).toMatchObject({ state: 'cancelled', vx: 0, vy: 0, target })
    expect(velocityTracker.recycle).toHaveBeenCalledOnce()
    expect(velocityTracker.addMovement).toHaveBeenCalledOnce()
    root.unmount()
  })

  it('keeps ACTION_UP ended and converts Android velocity from px/s to dip/s', () => {
    const velocityTracker = tracker()

    installAndroid(velocityTracker)

    const { container, root, host } = mountPanHost()

    container.dispatchEvent(host, 'pan', {
      state: 1,
      deltaX: 0,
      deltaY: 0,
      android: { current: nativeEvent(0) },
    })

    container.dispatchEvent(host, 'pan', {
      state: 3,
      deltaX: 40,
      deltaY: 0,
      android: { current: nativeEvent(1) },
    })

    expect(events.map((event) => event.state)).toEqual(['began', 'ended'])
    expect(events[1]).toMatchObject({ state: 'ended', vx: 400, vy: -120 })
    expect(velocityTracker.recycle).toHaveBeenCalledOnce()
    root.unmount()
  })
})

const panReads: Array<{ label: string; moves: number; state: PanEvent['state'] }> = []
let renderedPan: unknown

function StatefulPanHost(props: { label: string; enabled: boolean }) @{
  const [moves, setMoves] = useState(0)
  const callback = (event: PanEvent) => {
    panReads.push({ label: props.label, moves, state: event.state })
    if (event.state === 'moved') {
      setMoves(moves + 1)
    }
  }

  const onPan = usePan(props.enabled ? callback : undefined)

  renderedPan = onPan

  <masonview id="stateful-pan" onPan={onPan} style={{ display: 'flex' }} />
}

it('retains the pan bridge through its own movement rerender and reads committed callbacks', () => {
  panReads.length = 0

  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  let dispatchRetired: (() => void) | undefined

  try {
    flushUniversalSync(() => root.render(StatefulPanHost, { label: 'first', enabled: true }))

    const host = container.children[0]
    const original = renderedPan

    dispatchRetired = () => container.dispatchEvent(host, 'pan', { state: 2, deltaX: 30 })

    const dispatch = (state: number) =>
      flushUniversalSync(() => {
        container.dispatchEvent(host, 'pan', { state, deltaX: 25, deltaY: 0, view: host })
      })

    dispatch(1)
    dispatch(2)
    expect(renderedPan).toBe(original)
    dispatch(2)
    expect(panReads.at(-1)).toMatchObject({ label: 'first', moves: 1, state: 'moved' })
    flushUniversalSync(() => root.render(StatefulPanHost, { label: 'latest', enabled: true }))
    expect(renderedPan).toBe(original)
    dispatch(3)
    expect(panReads.at(-1)).toMatchObject({ label: 'latest', moves: 2, state: 'ended' })

    flushUniversalSync(() => root.render(StatefulPanHost, { label: 'removed', enabled: false }))
    expect(renderedPan).toBeUndefined()
    expect(() => dispatch(2)).toThrow(/no "pan" listener/)
    flushUniversalSync(() => root.render(StatefulPanHost, { label: 'restored', enabled: true }))
    expect(renderedPan).toBe(original)
    dispatch(0)
    expect(panReads.at(-1)).toMatchObject({ label: 'restored', state: 'cancelled' })
  } finally {
    root.unmount()
  }

  expect(container.children).toHaveLength(0)

  const finalReads = panReads.length

  expect(dispatchRetired).toThrow()
  expect(panReads).toHaveLength(finalReads)
})
