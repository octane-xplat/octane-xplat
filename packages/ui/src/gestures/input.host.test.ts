import { expect, it } from 'vitest'
import { createPanController, createPinchController } from './controller'
import { createMouseGestureAdapter, type HostGestureBridge } from './input.host'
import type { InputFrame } from './owner'

const scheduler = {
  frame: () => () => {},
  error(error: unknown) {
    throw error
  },
}

it('rejects unsupported contact requirements before touching the host bridge', () => {
  let reads = 0
  const adapter = createMouseGestureAdapter(
    'test',
    () => {
      reads++
      return undefined
    },
    scheduler,
  )
  const pinch = createPinchController({})
  const pan = createPanController({ axis: 'x', pointers: { min: 2, max: 2 } })
  try {
    expect(() => adapter.gesture({}, pinch.handle)).toThrow('one mouse contact')
    expect(() => adapter.gesture({}, pan.handle)).toThrow('one mouse contact')
    expect(reads).toBe(0)
  } finally {
    pinch.dispose()
    pan.dispose()
  }
})

it('rolls back the raw observer when semantic activation is unavailable', () => {
  let observers = 0
  const host = {}
  const bridge: HostGestureBridge = {
    gestureSurface: () => ({
      root: {},
      host,
      local: (point) => point,
      freeze: () => (point) => point,
      containsPoint: () => true,
      containsHost: (other) => other === host,
      observe() {
        observers++
        return () => {
          observers--
        }
      },
    }),
  }
  const adapter = createMouseGestureAdapter('test', () => bridge, scheduler)
  expect(() => adapter.press(host, { slop: 8 })).toThrow('semantic activation bridge unavailable')
  expect(observers).toBe(0)
})

it('rejects unsupported contact counts committed to an existing mouse attachment', () => {
  const host = {}
  const adapter = createMouseGestureAdapter(
    'test',
    () => ({
      gestureSurface: () => ({
        root: {},
        host,
        local: (point) => point,
        freeze: () => (point) => point,
        containsPoint: () => true,
        containsHost: (other) => other === host,
        observe: () => () => {},
      }),
    }),
    scheduler,
  )
  const pan = createPanController({ axis: 'x' })
  const off = adapter.gesture(host, pan.handle)
  try {
    expect(() => pan.commit({ axis: 'x', pointers: { min: 2, max: 2 } })).toThrow(
      'one mouse contact',
    )
  } finally {
    off()
    pan.dispose()
  }
})

it('schedules managed holds on the host clock and cancels timers on detach', () => {
  const host = {},
    root = {}
  let dispatch: ((frame: InputFrame, identity: string) => void) | undefined
  let timer: (() => void) | undefined
  const delays: number[] = []
  let cancelled = 0,
    holds = 0
  const bridge: HostGestureBridge = {
    gestureSurface: () => ({
      root,
      host,
      local: (point) => point,
      containsPoint: () => true,
      containsHost: (other) => other === host,
      observe(notify) {
        dispatch = notify
        return () => {
          dispatch = undefined
        }
      },
    }),
    observeGestureActivation: () => () => {},
  }
  const adapter = createMouseGestureAdapter('test', () => bridge, {
    ...scheduler,
    delay(callback, milliseconds) {
      timer = callback
      delays.push(milliseconds)
      return () => {
        cancelled++
        timer = undefined
      }
    },
  })
  const press = adapter.press(host, {
    slop: 8,
    longPressDelay: 500,
    onLongPress: () => {
      holds++
    },
  })
  const changed = { id: '1', kind: 'mouse' as const, window: { x: 0, y: 0 }, screen: null }
  try {
    dispatch?.({ type: 'down', changed, contacts: [changed], hitPath: [host], time: 0 }, '1')
    expect(delays).toEqual([500])
    timer?.()
    expect(holds).toBe(1)
    dispatch?.({ type: 'up', changed, contacts: [], hitPath: [host], time: 600 }, '2')
    dispatch?.({ type: 'down', changed, contacts: [changed], hitPath: [host], time: 700 }, '3')
    press.dispose()
    expect(cancelled).toBeGreaterThan(0)
    expect(timer).toBeUndefined()
    expect(dispatch).toBeUndefined()
  } finally {
    press.dispose()
  }
})
