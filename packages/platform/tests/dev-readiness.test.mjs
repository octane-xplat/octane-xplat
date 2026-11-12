import assert from 'node:assert/strict'
import test from 'node:test'
import { createDevReadinessScope } from '../src/dev-readiness-state.ts'

const options = () => ({ signal: new AbortController().signal, timeoutMs: 500 })

test('nested work, late registration in a microtask, and duplicate labels keep separate leases', async () => {
  const root = createDevReadinessScope('Root'),
    child = createDevReadinessScope('Child')

  const detach = root.include(child)
  const release = child.hold('Image'),
    second = child.hold('Image')

  assert.deepEqual(root.snapshot().pending, ['Child: Image', 'Child: Image'])
  release()
  release()

  let settled = false
  const wait = root.wait(options()).then(() => {
    settled = true
  })

  second()

  let late

  queueMicrotask(() => {
    late = child.hold('Font')
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
  const scope = createDevReadinessScope('Screen'),
    release = scope.hold('Fixture')

  const controller = new AbortController()
  const cancelled = scope.wait({ signal: controller.signal, timeoutMs: 500 })
  const survivor = scope.wait(options())

  controller.abort()
  await assert.rejects(cancelled, { code: 'readiness_cancelled' })
  await assert.rejects(
    scope.wait({ ...options(), timeoutMs: 10 }),
    (error) => error.code === 'readiness_timeout' && error.readiness.pending[0] === 'Fixture',
  )

  release()
  await survivor
  scope.dispose()
  await assert.rejects(scope.wait(options()), { code: 'readiness_disposed' })
})

test('owner disposal aborts outstanding waits and detached children stop blocking', async () => {
  const parent = createDevReadinessScope('Parent'),
    child = createDevReadinessScope('Child')

  child.hold('Request')

  const detach = parent.include(child)
  const wait = parent.wait(options())

  detach()
  await wait

  const pending = child.wait(options())

  child.dispose()
  await assert.rejects(pending, { code: 'readiness_disposed' })
  parent.dispose()
})
