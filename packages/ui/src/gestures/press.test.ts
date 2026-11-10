import { expect, it } from 'vitest'
import { createPressController, type PressOptions } from './press'
import type { InputFrame } from './owner'
import type { ActivationEvent } from './types'

function fixture(options: Partial<PressOptions> = {}) {
  const calls: string[] = [],
    activations: ActivationEvent[] = [],
    timers = new Set<() => void>()

  let claims = 0,
    time = 0

  const press = createPressController(
    {
      slop: 8,
      onPress: (event) => {
        activations.push(event)
      },
      onPressIn: () => calls.push('in'),
      onPressOut: () => calls.push('out'),
      ...options,
    },
    {
      space: {
        target: { id: 'button' },
        local: (point) => ({ x: point.x - 10, y: point.y }),
        freeze: () => (point) => point,
      },
      call(callback) {
        callback?.()
      },
      schedule(callback) {
        timers.add(callback)
        return () => {
          timers.delete(callback)
        }
      },
      claim() {
        claims++
        return true
      },
      contains: (point) => point.x >= 10 && point.x <= 200,
    },
  )

  const frame = (
    type: InputFrame['type'],
    x: number,
    count = type === 'up' || type === 'cancel' ? 0 : 1,
  ): InputFrame => {
    const changed = { id: '1', kind: 'touch' as const, window: { x, y: 20 }, screen: { x, y: 40 } }

    return {
      type,
      time: (time += 10),
      contacts: Array.from({ length: count }, (_, i) => ({ ...changed, id: String(i + 1) })),
      changed,
      hitPath: [],
    }
  }

  return {
    press,
    calls,
    activations,
    frame,
    timers,
    claims: () => claims,
    down(x = 20) {
      press.begin(frame('down', x), `sequence:${time}`, { id: 'text-hit' })
    },
    up(x = 20) {
      press.update(frame('up', x))
    },
  }
}

it('rejects a moving 80-unit release but accepts the next independent pointer and keyboard action', () => {
  const f = fixture()

  f.down()
  f.press.update(f.frame('move', 100))
  f.up(100)
  expect(f.press.activate('pointer')).toBe(false)
  expect(f.calls).toEqual(['in', 'out'])
  f.down()
  f.up()
  expect(f.press.activate('pointer')).toBe(true)
  expect(f.activations[0].pointer?.position.local).toEqual({ x: 10, y: 20 })
  expect(f.activations[0].pointer?.pointerCount).toBe(0)
  expect(f.activations[0].target.id).toBe('text-hit')
  expect(f.press.activate('keyboard')).toBe(true)
  expect(f.activations[1].pointer).toBeNull()
  f.press.dispose()
})

it('balances press-out exactly once through multi-touch, cancellation, repeated cleanup and pending activation', () => {
  const f = fixture()

  f.down()
  f.press.update(f.frame('down', 20, 2))
  f.press.cancel()
  f.up()
  expect(f.calls).toEqual(['in', 'out'])
  expect(f.press.activate('pointer')).toBe(false)
  f.down()
  f.up()
  f.press.cancel()
  expect(f.press.activate('pointer')).toBe(false)
  f.down()
  f.press.dispose()
  f.press.dispose()
  expect(f.calls).toEqual(['in', 'out', 'in', 'out', 'in', 'out'])
  expect(f.press.activate('accessibility')).toBe(false)
})

it('commits callbacks without replacing contact state and cancels synchronously when disabled', () => {
  const f = fixture(),
    received: string[] = []

  f.down()
  f.press.commit({
    slop: 8,
    onPress: () => received.push('latest'),
    onPressOut: () => received.push('out'),
  })

  f.up()
  f.press.activate('pointer')
  expect(received).toEqual(['out', 'latest'])
  f.down()
  f.press.commit({ slop: 8, enabled: false, onPressOut: () => received.push('disabled-out') })
  f.up()
  expect(received.at(-1)).toBe('disabled-out')
  expect(f.press.activate('virtual')).toBe(false)
  f.press.dispose()
})

it('claims a hold before its action and never activates a tap or late timer from that contact', () => {
  const calls: string[] = []
  const f = fixture({ longPressDelay: 500, onLongPress: () => calls.push('hold') })

  f.down()
  for (const timer of [...f.timers]) {
    timer()
  }

  expect(f.claims()).toBe(1)
  expect(calls).toEqual(['hold'])
  f.up()
  expect(f.press.activate('pointer')).toBe(false)
  expect(f.timers.size).toBe(0)
  f.down()
  f.press.cancel()
  for (const timer of [...f.timers]) {
    timer()
  }

  expect(calls).toEqual(['hold'])
  f.press.dispose()
})

it('forwards semantic default cancellation and prevents a scope-cancelled double activation', () => {
  let prevented = 0,
    doubled = 0

  const f = fixture({ onPress: (event) => event.preventDefault(), onDoublePress: () => doubled++ })

  f.down()
  f.up()
  f.press.activate('pointer', () => prevented++)
  expect(prevented).toBe(1)
  f.press.cancel()
  expect(f.press.activate('pointer', undefined, 'double')).toBe(false)
  expect(doubled).toBe(0)
  f.press.dispose()
})

it('copies non-enumerable native point fields before measuring press movement', () => {
  const f = fixture()
  const frame = f.frame('down', 20)

  Object.defineProperty(frame.changed.window, 'x', { value: 20, enumerable: false })
  Object.defineProperty(frame.changed.window, 'y', { value: 20, enumerable: false })
  f.press.begin(frame, 'native-struct', { id: 'button' })
  f.up(100)
  expect(f.press.activate('pointer')).toBe(false)
  f.press.dispose()
})
