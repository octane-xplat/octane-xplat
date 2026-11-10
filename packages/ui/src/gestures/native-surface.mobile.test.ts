import { afterEach, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
  GestureEvents: { gestureAttached: 'gestureAttached' },
  GestureTypes: { touch: 128 },
}))

import { nativeGestureSurface } from './native-surface.ios'
import { attachNativeGesture, type NativeGestureView } from './input.native'
import { createPanController, createPinchController } from './controller'
import { compete } from './composition'

class NativeView {
  window: NativeView | null = null
  superview: NativeView | null = null
  bounds = { origin: { x: 0, y: 0 } }
  convertPointToView(point: { x: number; y: number }) {
    return point
  }
  convertPointToWindow(point: { x: number; y: number }) {
    return point
  }
}

function collection<T>(values: readonly T[]) {
  return {
    count: values.length,
    objectAtIndex(index: number) {
      return values[index]
    },
    allObjects: {
      count: values.length,
      firstObject: values[0],
      objectAtIndex(index: number) {
        return values[index]
      },
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

it('admits simultaneous UIKit downs even when allTouches has two contacts and changedTouches has one', () => {
  vi.stubGlobal('UIView', NativeView)

  const window = new NativeView(),
    host = new NativeView()

  window.window = window
  host.window = window
  host.superview = window

  let listener: ((event: unknown) => void) | null = null
  const view = {
    nativeViewProtected: host,
    style: { touchAction: 'auto' },
    on(event: string, next: (event: unknown) => void) {
      if (event === 'touch') {
        listener = next
      }
    },
    off(event) {
      if (event === 'touch') {
        listener = null
      }
    },
  }

  let span = 120,
    phase = 0,
    time = 0,
    starts = 0,
    ends = 0,
    pans = 0

  const touch = (hash: number, sign: number) => ({
    hash,
    window,
    view: host,
    type: 0,
    get phase() {
      return phase
    },
    get timestamp() {
      return time
    },
    locationInView() {
      return { x: 200 + (sign * span) / 2, y: 200 }
    },
  })

  const first = touch(1, -1),
    second = touch(2, 1)

  const emit = (action: string) => {
    listener?.({
      action,
      ios: {
        touches: collection([first]),
        event: { timestamp: (time += 0.02), allTouches: collection([first, second]) },
      },
    })
  }

  const pinch = createPinchController({
    onStart() {
      starts++
    },
    onEnd() {
      ends++
    },
  })

  const pan = createPanController({
    axis: 'y',
    onStart() {
      pans++
    },
  })

  const detach = attachNativeGesture(nativeGestureSurface(view), compete(pinch.handle, pan.handle))

  try {
    emit('down')
    expect(pinch.handle.phase$.get()).toBe('possible')
    span = 140
    phase = 1
    emit('move')
    expect(starts).toBe(1)
    expect(pinch.handle.pointerCount$.get()).toBe(2)
    phase = 3
    emit('up')
    expect(ends).toBe(1)
    expect(pinch.handle.pointerCount$.get()).toBe(0)
    expect(pans).toBe(0)
  } finally {
    detach()
    pinch.dispose()
    pan.dispose()
  }
})

it('uses Mason logical hit ancestry when UIKit ancestry does not contain the gesture host', () => {
  vi.stubGlobal('UIView', NativeView)

  const window = new NativeView(),
    host = new NativeView(),
    physicalHit = new NativeView()

  window.window = window
  host.window = window
  physicalHit.window = window
  physicalHit.superview = window

  let listener: ((event: unknown) => void) | null = null
  const view: NativeGestureView = {
    nativeViewProtected: host,
    style: { touchAction: 'auto' },
    on(event, next) {
      if (event === 'touch') {
        listener = next
      }
    },
    off(event) {
      if (event === 'touch') {
        listener = null
      }
    },
    elementFromPoint() {
      return { nativeViewProtected: physicalHit, parent: view }
    },
  }

  let x = 10,
    phase = 0,
    starts = 0,
    time = 0

  const touch = {
    hash: 1,
    window,
    view: physicalHit,
    type: 0,
    get phase() {
      return phase
    },
    get timestamp() {
      return time
    },
    locationInView() {
      return { x, y: 20 }
    },
  }

  const pan = createPanController({
    axis: 'x',
    onStart() {
      starts++
    },
  })

  const detach = attachNativeGesture(nativeGestureSurface(view), pan.handle)
  const emit = (action: string) =>
    listener?.({
      action,
      ios: {
        touches: collection([touch]),
        event: { timestamp: (time += 0.02), allTouches: collection([touch]) },
      },
    })

  try {
    emit('down')
    x = 30
    phase = 1
    emit('move')
    expect(starts).toBe(1)
    phase = 3
    emit('up')
    expect(pan.handle.pointerCount$.get()).toBe(0)
  } finally {
    detach()
    pan.dispose()
  }
})
