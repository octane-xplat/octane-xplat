import { expect, it } from 'vitest'
import { freezeGestureBasis } from './geometry'

it('freezes host axes independently of live movement and scale', () => {
  let offset = 10,
    scale = 2

  const frozen = freezeGestureBasis((point) => ({
    x: point.x / scale - offset,
    y: point.y / scale,
  }))

  offset = 100
  scale = 4
  expect(frozen?.({ x: 80, y: 20 })).toEqual({ x: 30, y: 10 })
})

it('rejects missing, singular and nonfinite coordinate planes', () => {
  expect(freezeGestureBasis(() => null)).toBeNull()
  expect(freezeGestureBasis(() => ({ x: 0, y: 0 }))).toBeNull()
  expect(freezeGestureBasis((point) => ({ x: point.x, y: Infinity }))).toBeNull()
})
