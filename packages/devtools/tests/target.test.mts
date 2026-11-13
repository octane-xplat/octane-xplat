import { test } from 'node:test'
import assert from 'node:assert/strict'
import { autoTarget } from '../src/desktop/target.ts'

function record(appRoot, key = 'k'.repeat(64)) {
  return {
    key,
    appRoot,
    endpoint: 'http://127.0.0.1:59999/rpc',
    instanceId: 'a'.repeat(32),
    devtoolsToken: 'c'.repeat(64),
  }
}

test('autoTarget prefers the record matching the selected project root', () => {
  const a = record('/apps/one', 'a'.repeat(64))
  const b = record('/apps/two', 'b'.repeat(64))

  assert.equal(autoTarget([a, b], '/apps/two'), b)
})

test('autoTarget accepts a trailing slash on either side', () => {
  const a = record('/apps/one')

  assert.equal(autoTarget([a], '/apps/one/'), a)
  assert.equal(autoTarget([record('/apps/one/')], '/apps/one').appRoot, '/apps/one/')
})

test('autoTarget picks the sole record without a preferred root', () => {
  const only = record('/apps/solo')

  assert.equal(autoTarget([only], null), only)
})

test('autoTarget asks when no records exist or several exist without a match', () => {
  assert.equal(autoTarget([], null), null)
  assert.equal(autoTarget([], '/apps/one'), null)
  assert.equal(autoTarget([record('/apps/one'), record('/apps/two')], null), null)
  assert.equal(autoTarget([record('/apps/one'), record('/apps/two')], '/apps/three'), null)
})

test('autoTarget falls back to the sole record when the preferred root has no match', () => {
  const only = record('/apps/solo')

  assert.equal(autoTarget([only], '/apps/elsewhere'), only)
})
