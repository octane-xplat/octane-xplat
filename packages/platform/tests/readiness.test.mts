import assert from 'node:assert/strict'
import test from 'node:test'
import { createReadinessScope } from '../src/readiness-state.ts'

const options = () => ({ signal: new AbortController().signal, timeoutMs: 500 })

test('nested work, late registration in a microtask, and duplicate labels keep separate leases', async () => {
  const root = createReadinessScope('Root'),
    child = createReadinessScope('Child')

  const detach = root.include(child)
  const release = child.register({ label: 'Image', pending: true }).dispose,
    second = child.register({ label: 'Image', pending: true }).dispose

  assert.deepEqual(root.snapshot().pending, [
    { label: 'Child: Image', blocking: true },
    { label: 'Child: Image', blocking: true },
  ])

  release()
  release()

  let settled = false
  const wait = root.wait(options()).then(() => {
    settled = true
  })

  second()

  let late

  queueMicrotask(() => {
    late = child.register({ label: 'Font', pending: true }).dispose
  })

  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(settled, false)
  late()
  await wait
  assert.equal(root.snapshot().pending.length, 0)
  assert.throws(() => child.include(root), /acyclic/)
  detach()
  child.dispose()
  root.dispose()
})

test('cancellation is local to one waiter and deadlines retain blocker labels', async () => {
  const scope = createReadinessScope('Screen'),
    release = scope.register({ label: 'Fixture', pending: true }).dispose

  const controller = new AbortController()
  const cancelled = scope.wait({ signal: controller.signal, timeoutMs: 500 })
  const survivor = scope.wait(options())

  controller.abort()
  await assert.rejects(cancelled, { code: 'readiness_cancelled' })
  await assert.rejects(
    scope.wait({ ...options(), timeoutMs: 10 }),
    (error) =>
      error.code === 'readiness_timeout' && error.readiness.pending[0]?.label === 'Fixture',
  )

  release()
  await survivor
  scope.dispose()
  await assert.rejects(scope.wait(options()), { code: 'readiness_disposed' })
})

test('owner disposal aborts outstanding waits and detached children stop blocking', async () => {
  const parent = createReadinessScope('Parent'),
    child = createReadinessScope('Child')

  child.register({ label: 'Request', pending: true })

  const detach = parent.include(child)
  const wait = parent.wait(options())

  detach()
  await wait

  const pending = child.wait(options())

  child.dispose()
  await assert.rejects(pending, { code: 'readiness_disposed' })
  parent.dispose()
})

test('failure is not pending; updating the same task recovers without retaining error data', async () => {
  const scope = createReadinessScope('Checkout')
  const task = scope.register({
    label: 'Payment',
    pending: false,
    error: new Error('private data'),
  })

  assert.equal(scope.snapshot().status, 'blocked')
  assert.deepEqual(scope.snapshot().pending, [])
  assert.deepEqual(scope.snapshot().failures, [{ label: 'Payment', blocking: true }])
  assert.equal(JSON.stringify(scope.snapshot()).includes('private data'), false)
  await assert.rejects(scope.wait(options()), { code: 'readiness_failed' })
  task.update({ label: 'Payment', pending: true })
  assert.equal(scope.snapshot().status, 'pending')
  assert.deepEqual(scope.snapshot().failures, [])
  task.update({ label: 'Payment', pending: false })
  await scope.wait(options())
  assert.equal(scope.snapshot().status, 'ready')
  scope.dispose()
  task.update({ label: 'Late callback', pending: true })
  task.dispose()
})

test('background activity keeps a screen usable while strict callers await completion and reject errors', async () => {
  const scope = createReadinessScope('Feed')
  const task = scope.register({ label: 'Refresh', pending: true, blocking: false })

  assert.equal(scope.snapshot().status, 'ready')
  assert.equal(scope.snapshot().pending.length, 1)
  await scope.wait(options())
  await assert.rejects(scope.wait({ ...options(), timeoutMs: 10, includeBackground: true }), {
    code: 'readiness_timeout',
  })

  task.update({ label: 'Refresh', pending: false, blocking: false, error: true })
  assert.equal(scope.snapshot().status, 'ready')
  await scope.wait(options())
  await assert.rejects(scope.wait({ ...options(), includeBackground: true }), {
    code: 'readiness_failed',
  })

  task.update({ label: 'Refresh', pending: false, blocking: false })
  await scope.wait({ ...options(), includeBackground: true })
  scope.dispose()
})
