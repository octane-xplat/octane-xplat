import assert from 'node:assert/strict'
import test from 'node:test'
import { createMotionTime } from '../src/motion-time.ts'

test('rate changes preserve animation progress and rearm pending motion deadlines', () => {
  let real = 0
  const wakes = new Map<() => void, number>()
  const clock = createMotionTime({
    now: () => real,
    wake(callback, delay) {
      wakes.set(callback, real + delay)
      return () => {
        wakes.delete(callback)
      }
    },
  })

  function advance(to: number) {
    real = to
    for (const [callback, at] of wakes) {
      if (at <= real) {
        wakes.delete(callback)
        callback()
      }
    }
  }

  let calls = 0

  clock.schedule(() => {
    calls++
  }, 300)

  const cancel = clock.schedule(() => assert.fail('cancelled timer fired'), 300)

  advance(100)

  const oldWake = [...wakes.keys()][0]!

  clock.setRate(0.25)
  assert.equal(clock.now(), 100)
  cancel()
  oldWake()
  assert.deepEqual([...wakes.values()], [900])
  advance(500)
  assert.equal(clock.now(), 200)
  assert.equal(calls, 0)
  clock.setRate(1)
  assert.equal(clock.now(), 200)
  advance(599)
  assert.equal(calls, 0)
  advance(600)
  assert.equal(clock.now(), 300)
  assert.equal(calls, 1)
  assert.equal(wakes.size, 0)
})

test('startup rate and very small positive rates retain a bounded host timeout', () => {
  let delay = 0
  const clock = createMotionTime(
    {
      now: () => 0,
      wake(_callback, ms) {
        delay = ms
        return () => {}
      },
    },
    0.25,
  )

  const cancel = clock.schedule(() => {}, 300)

  assert.equal(delay, 1200)
  clock.setRate(Number.MIN_VALUE)
  assert.equal(delay, 2_147_483_647)
  assert.throws(() => clock.setRate(0), RangeError)
  cancel()
})
