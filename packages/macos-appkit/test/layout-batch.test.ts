import assert from 'node:assert/strict'
import { test } from 'node:test'
import { withLayoutBatch, type LayoutBatchState } from '../src/layout-batch.ts'

test('nested layout work joins one root owner and commits once after releasing ownership', () => {
  const root: LayoutBatchState<string> = { layoutDirty: null }
  const drained: string[][] = []
  withLayoutBatch(root, () => {
    root.layoutDirty!.add('outer')
    withLayoutBatch(root, () => root.layoutDirty!.add('inner'), () => assert.fail('nested commit'))
  }, dirty => {
    assert.equal(root.layoutDirty, null)
    drained.push([...dirty])
  })
  assert.deepEqual(drained, [['outer', 'inner']])
})

test('a failed update commits acquired layout work and leaves the root available for the next update', () => {
  const root: LayoutBatchState<string> = { layoutDirty: null }
  const drained: string[][] = []
  assert.throws(() => withLayoutBatch(root, () => {
    root.layoutDirty!.add('partial')
    throw new Error('native write failed')
  }, dirty => drained.push([...dirty])), /native write failed/)
  assert.equal(root.layoutDirty, null)
  withLayoutBatch(root, () => root.layoutDirty!.add('retry'), dirty => drained.push([...dirty]))
  assert.deepEqual(drained, [['partial'], ['retry']])
})

test('a failing commit releases ownership and other roots keep independent batches', () => {
  const first: LayoutBatchState<string> = { layoutDirty: null }
  const second: LayoutBatchState<string> = { layoutDirty: null }
  assert.throws(() => withLayoutBatch(first, () => {
    withLayoutBatch(second, () => second.layoutDirty!.add('second'), dirty => {
      assert.notEqual(first.layoutDirty, null)
      assert.deepEqual([...dirty], ['second'])
    })
  }, () => { throw new Error('layout commit failed') }), /layout commit failed/)
  assert.equal(first.layoutDirty, null)
  assert.equal(second.layoutDirty, null)
})

test('outcomes distinguish empty failed updates and preserve update plus finalizer failures', () => {
  const root: LayoutBatchState<string> = { layoutDirty: null }
  const primary = Error('update'), cleanup = Error('commit')
  assert.throws(() => withLayoutBatch(root, () => { throw primary }, (dirty, outcome) => {
    assert.equal(dirty.size, 0)
    assert.equal(outcome, 'failed')
    assert.equal(root.layoutDirty, null)
    throw cleanup
  }), error => {
    assert.ok(error instanceof AggregateError)
    assert.deepEqual(error.errors, [primary, cleanup])
    return true
  })
  withLayoutBatch(root, () => {}, (_dirty, outcome) => assert.equal(outcome, 'succeeded'))
})

test('throwing undefined is a failed update and is not mistaken for success', () => {
  const root: LayoutBatchState<string> = { layoutDirty: null }
  let thrown = false
  try {
    withLayoutBatch(root, () => { throw undefined }, (_dirty, outcome) => assert.equal(outcome, 'failed'))
  } catch (error) {
    thrown = true
    assert.equal(error, undefined)
  }
  assert.equal(thrown, true)
  assert.equal(root.layoutDirty, null)
})
