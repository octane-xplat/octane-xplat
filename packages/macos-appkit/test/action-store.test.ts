import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createActionStore } from '../src/action-store.ts'

test('native tag dispatch keeps identity on replacement and rejects invalid native IDs', () => {
  const store = createActionStore(),
    view = {},
    calls: string[] = []

  const lease = store.allocate(view)

  lease.setHandler(() => calls.push('old'))
  store.dispatch(lease.id)
  lease.setHandler(() => calls.push('new'))
  for (const id of [undefined, null, '1', 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    store.dispatch(id)
  }

  store.dispatch(lease.id)
  assert.equal(store.idForView(view), lease.id)
  assert.equal(store.hasHandler(view), true)
  assert.deepEqual(calls, ['old', 'new'])
  lease.setHandler(undefined)
  assert.equal(store.hasHandler(view), false)
  store.dispatch(lease.id)
  assert.deepEqual(calls, ['old', 'new'])
})

test('release is inert under reentry, held dispatch, handler resurrection and view replacement', () => {
  const store = createActionStore(),
    view = {},
    calls: string[] = []

  const old = store.allocate(view)

  old.setHandler(() => calls.push('old'))

  const held = () => store.dispatch(old.id)
  const next = store.allocate(view)

  next.setHandler(() => {
    next.release()
    store.dispatch(next.id)
    calls.push('next')
  })

  held()
  old.release()
  old.release()
  old.setHandler(() => calls.push('resurrected'))
  assert.equal(store.idForView(view), next.id)
  assert.equal(store.hasHandler(view), true)
  store.dispatch(next.id)
  held()
  store.dispatch(next.id)
  assert.equal(store.idForView(view), undefined)
  assert.equal(store.hasHandler(view), false)
  assert.deepEqual(calls, ['next'])
})
