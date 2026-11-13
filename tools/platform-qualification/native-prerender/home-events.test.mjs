import assert from 'node:assert/strict'
import test from 'node:test'
import { completedHomeEpoch } from './home-events.mjs'
const passed = (epoch) => ({ event: 'passed', epoch, nativeHomeMountQualified: true })
const parity = (epoch) => ({ event: 'home-proof', phase: 'parity', epoch })
const created = (epoch) => ({ event: 'warm-home-created', epoch })
const destroyed = (epoch) => ({ event: 'activity-destroyed', epoch })

test('requires an actual native passing receipt for the current generation', () => {
  assert.equal(completedHomeEpoch([], false), undefined)
  assert.equal(completedHomeEpoch([created(1)], false), undefined)
  assert.equal(completedHomeEpoch([created(1), passed(1)], false), 1)
})
test('parity mode waits beyond the initial native pass', () => {
  assert.equal(completedHomeEpoch([passed(1)], true), undefined)
  assert.equal(completedHomeEpoch([passed(1), parity(1)], true), 1)
})
test('a destroyed generation cannot complete the probe', () => {
  assert.equal(completedHomeEpoch([passed(1), parity(1), destroyed(1)], true), undefined)
})
test('a new generation invalidates an earlier complete result', () => {
  assert.equal(completedHomeEpoch([passed(1), parity(1), created(2)], true), undefined)
  assert.equal(completedHomeEpoch([passed(1), parity(1), created(2), passed(2)], true), undefined)
})
test('late cancellation receipts cannot replace a completed current generation', () => {
  const events = [
    passed(1),
    destroyed(1),
    created(2),
    passed(2),
    parity(2),
    { event: 'home-proof', phase: 'parity-cancelled', epoch: 1 },
  ]
  assert.equal(completedHomeEpoch(events, true), 2)
})
test('a late old parity receipt cannot qualify an incomplete new generation', () => {
  assert.equal(
    completedHomeEpoch([passed(1), destroyed(1), created(2), passed(2), parity(1)], true),
    undefined,
  )
})
