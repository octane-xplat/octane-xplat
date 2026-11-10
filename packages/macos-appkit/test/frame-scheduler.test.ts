import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFrameScheduler } from '../src/frame-scheduler.ts'

function fixture() {
  const deliveries: ((time: number) => void)[] = []
  const errors: unknown[] = []
  let stops = 0
  const scheduler = createFrameScheduler({
    now: () => 42,
    start: (deliver) => {
      deliveries.push(deliver)
    },
    stop: () => {
      stops++
    },
    reportError: (error) => {
      errors.push(error)
    },
  })

  return { scheduler, deliveries, errors, stops: () => stops }
}

test('one driver, one timestamp per batch, one-shot callbacks, idle stop and stale delivery', () => {
  const f = fixture()
  const times: number[] = []

  f.scheduler.request((time) => times.push(time))
  f.scheduler.request((time) => times.push(time))
  assert.equal(f.deliveries.length, 1)
  assert.equal(f.scheduler.now(), 42)
  f.deliveries[0](51)
  assert.deepEqual(times, [51, 51])
  assert.equal(f.stops(), 1)
  f.scheduler.request((time) => times.push(time))
  f.deliveries[0](52)
  assert.deepEqual(times, [51, 51])
  f.deliveries[1](60)
  assert.deepEqual(times, [51, 51, 60])
  assert.equal(f.stops(), 2)
})

test('cancellation during dispatch, reentrant requests deferred, errors do not starve peers', () => {
  const f = fixture()
  const events: string[] = []
  const failure = new Error('consumer')

  f.scheduler.request(() => {
    events.push('first')
    f.scheduler.cancel(second)
    f.scheduler.request(() => events.push('next'))
    throw failure
  })

  const second = f.scheduler.request(() => events.push('cancelled'))

  f.scheduler.request(() => events.push('peer'))
  f.deliveries[0](50)
  assert.deepEqual(events, ['first', 'peer'])
  assert.deepEqual(f.errors, [failure])
  assert.equal(f.stops(), 0)
  f.deliveries[0](60)
  assert.deepEqual(events, ['first', 'peer', 'next'])
  assert.equal(f.stops(), 1)
})

test('cancelling the last request stops immediately and accepts foreign handles', () => {
  const f = fixture()
  const id = f.scheduler.request(() => assert.fail('cancelled'))

  f.scheduler.cancel({})
  assert.equal(f.stops(), 0)
  f.scheduler.cancel(id)
  f.scheduler.cancel(id)
  f.deliveries[0](50)
  assert.equal(f.stops(), 1)
})

test('start failure clears the request and releases the driver before retry', () => {
  let fail = true
  let stops = 0
  let deliver: ((time: number) => void) | undefined
  const scheduler = createFrameScheduler({
    now: () => 0,
    start: (callback) => {
      if (fail) {
        throw Error('unavailable')
      }

      deliver = callback
    },
    stop: () => {
      stops++
    },
    reportError: () => {},
  })

  assert.throws(() => scheduler.request(() => assert.fail('failed request')), /unavailable/)
  assert.equal(stops, 1)
  fail = false

  let calls = 0

  scheduler.request(() => calls++)
  deliver?.(2)
  assert.equal(calls, 1)
  assert.equal(stops, 2)
})
