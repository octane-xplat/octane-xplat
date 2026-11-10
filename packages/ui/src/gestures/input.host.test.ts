import { expect, it } from 'vitest'
import { createPanController, createPinchController } from './controller'
import { createMouseGestureAdapter, type HostGestureBridge } from './input.host'

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
