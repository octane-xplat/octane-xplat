import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

const SOURCE = readFileSync(new URL('../src/background-tasks.ts', import.meta.url), 'utf8')
  .replace(/import\s*\{[\s\S]*?\}\s*from '@nativescript\/core'/, '')
  .replace(/import type[\s\S]*?from '\.\/types'\n/, '')
  .replace('export const', 'const')

const IDENTIFIER = 'com.octanexplat.tasks.refresh'

function fixture({
  submitError = false,
  registrationResult = true as boolean | 'false' | 'throw' | 'again',
} = {}) {
  const handlers = new Map<string, any>()
  const submitted: any[] = []
  const cancelled: string[] = []
  const completions: boolean[] = []
  const context = vm.createContext({
    isIOS: true,
    BGAppRefreshTaskRequest: {
      alloc: () => ({
        initWithIdentifier(identifier: string) {
          return { identifier, earliestBeginDate: undefined }
        },
      }),
    },
    BGTaskScheduler: {
      sharedScheduler: {
        registerForTaskWithIdentifierUsingQueueLaunchHandler(
          identifier: string,
          _queue: any,
          handler: any,
        ) {
          if (handlers.has(identifier)) {
            throw new Error('second registration of the same identifier kills the app')
          }
          if (registrationResult === 'throw') {
            throw new Error('launch handlers must be registered before app launch finishes')
          }
          if (registrationResult === 'again') {
            throw new Error(
              `launch handler for task with identifier ${identifier} has already been registered`,
            )
          }
          if (registrationResult === 'false') {
            return false
          }
          handlers.set(identifier, handler)
          return true
        },
        cancelTaskRequestWithIdentifier(identifier: string) {
          cancelled.push(identifier)
        },
        submitTaskRequestError(request: any, errorRef: any) {
          if (submitError) {
            if (errorRef) {
              errorRef.value = { localizedDescription: 'identifier is not permitted' }
            }

            return false
          }
          submitted.push(request)
          return true
        },
      },
    },
    NSDate: {
      dateWithTimeIntervalSinceNow: (seconds: number) => ({ seconds }),
    },
    interop: {
      Reference: class Reference {
        value: any
      },
    },
    UIApplication: { sharedApplication: { backgroundRefreshStatus: 2 } },
  })
  const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', context)

  const dispatch = (identifier = IDENTIFIER) => {
    const handler = handlers.get(identifier)
    assert.ok(handler, `no launch handler registered for ${identifier}`)
    const task = {
      identifier,
      expirationHandler: undefined as undefined | (() => void),
      setTaskCompletedWithSuccess(success: boolean) {
        completions.push(success)
      },
    }
    handler(task)
    return task
  }

  return { leaf, handlers, submitted, cancelled, completions, dispatch }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

test('defineTask registers the iOS launch handler once per identifier', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  f.leaf.defineTask('refresh', async () => 'success')
  assert.equal(f.handlers.size, 1)
  assert.ok(f.handlers.has(IDENTIFIER))
  // defineTask alone never schedules work.
  assert.equal(f.submitted.length, 0)
  assert.equal(await f.leaf.isRegistered('refresh'), false)
})

test('register submits a request and repeated enable stays idempotent', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  await f.leaf.register('refresh', { minimumInterval: 3600 })
  await f.leaf.register('refresh', { minimumInterval: 900 })
  // Each enable replaces the pending request: cancel, then submit.
  assert.deepEqual(f.cancelled, [IDENTIFIER, IDENTIFIER])
  assert.equal(f.submitted.length, 2)
  assert.equal(f.submitted[1].identifier, IDENTIFIER)
  assert.equal(f.submitted[1].earliestBeginDate.seconds, 900)
  assert.equal(await f.leaf.isRegistered('refresh'), true)
  // Repeated enable never re-registers the launch handler.
  assert.equal(f.handlers.size, 1)
})

test('a successful run reports success and resubmits the next request', async () => {
  const f = fixture()
  let expiredSeen: boolean | null = null
  f.leaf.defineTask('refresh', async (context: { name: string; expired: boolean }) => {
    expiredSeen = context.expired
    return 'success'
  })
  await f.leaf.register('refresh', { minimumInterval: 3600 })
  assert.equal(f.submitted.length, 1)

  f.dispatch()
  await tick()
  assert.deepEqual(f.completions, [true])
  assert.equal(expiredSeen, false)
  // The consumed request was resubmitted for the next run.
  assert.equal(f.submitted.length, 2)
  assert.equal(f.submitted[1].earliestBeginDate.seconds, 3600)
})

test('a failed executor reports failure and still resubmits', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'failed')
  f.leaf.defineTask('thrown', async () => {
    throw new Error('network down')
  })
  await f.leaf.register('refresh', {})
  await f.leaf.register('thrown', {})

  f.dispatch()
  await tick()
  f.dispatch('com.octanexplat.tasks.thrown')
  await tick()
  assert.deepEqual(f.completions, [false, false])
  assert.equal(f.submitted.length, 4)
})

test('expiration during async work completes exactly once and expires the context', async () => {
  const f = fixture()
  let release: () => void = () => {}
  const observed: boolean[] = []
  f.leaf.defineTask(
    'refresh',
    (context: { name: string; expired: boolean }) =>
      new Promise<string>((resolve) => {
        observed.push(context.expired)
        release = () => {
          observed.push(context.expired)
          resolve('success')
        }
      }),
  )
  await f.leaf.register('refresh', {})

  const task = f.dispatch()
  assert.equal(typeof task.expirationHandler, 'function')
  task.expirationHandler()
  assert.deepEqual(f.completions, [false])
  // The running executor can observe the expiration cooperatively.
  release()
  await tick()
  assert.deepEqual(observed, [false, true])
  // The late success cannot reopen completion; the request resubmitted once.
  assert.deepEqual(f.completions, [false])
  assert.equal(f.submitted.length, 2)
})

test('unregister cancels the pending request and stops resubmission', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  await f.leaf.register('refresh', {})
  await f.leaf.unregister('refresh')
  assert.equal(await f.leaf.isRegistered('refresh'), false)

  f.dispatch()
  await tick()
  // The run still completes honestly, but no next request is submitted.
  assert.deepEqual(f.completions, [true])
  assert.equal(f.submitted.length, 1)
  assert.equal(f.cancelled.filter((id) => id === IDENTIFIER).length, 2)
})

test('registering an undefined task rejects; a rejected submit reports the plist contract', async () => {
  const f = fixture()
  await assert.rejects(f.leaf.register('ghost'), /no defineTask/)

  const denied = fixture({ submitError: true })
  denied.leaf.defineTask('refresh', async () => 'success')
  await assert.rejects(denied.leaf.register('refresh'), /not permitted|PermittedIdentifiers/)
  assert.equal(await denied.leaf.isRegistered('refresh'), false)
})

test('register refuses to submit without a ready launch handler — the OS crash gate', async () => {
  // Submitting with no registered handler raises an uncatchable
  // NSInternalInconsistencyException in the real scheduler; the leaf must
  // reject before reaching it.
  for (const mode of ['false', 'throw'] as const) {
    const f = fixture({ registrationResult: mode })
    f.leaf.defineTask('refresh', async () => 'success')
    await assert.rejects(f.leaf.register('refresh'), /no registered iOS launch handler/)
    assert.equal(f.submitted.length, 0)
    assert.equal(await f.leaf.isRegistered('refresh'), false)
  }
})

test('an already-registered handler still counts as ready', async () => {
  // A module re-eval re-runs defineTask while the first evaluation's handler
  // remains registered at the OS level — scheduling must keep working.
  const f = fixture({ registrationResult: 'again' })
  f.leaf.defineTask('refresh', async () => 'success')
  await f.leaf.register('refresh', {})
  assert.equal(f.submitted.length, 1)
})

test('getStatus maps the background-refresh posture', async () => {
  const f = fixture()
  assert.equal(await f.leaf.getStatus(), 'available')
  const bare = vm.createContext({ isIOS: true })
  const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', bare)
  assert.equal(leaf.supported, false)
  assert.equal(await leaf.getStatus(), 'unavailable')
})
