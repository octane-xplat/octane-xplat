import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

const SOURCE = readFileSync(new URL('../src/background-tasks.ts', import.meta.url), 'utf8')
  .replace(/import\s*\{[\s\S]*?\}\s*from '@nativescript\/core'/, '')
  .replace(/import type[\s\S]*?from '\.\/types'\n/, '')
  .replace('export const', 'const')

const WORKER_SOURCE = readFileSync(
  new URL('../platforms/android/java/com/octanexplat/tasks/TaskWorker.java', import.meta.url),
  'utf8',
)

interface TaskRunnerImpl {
  run(name: string, outcome: { onResult(r: string): void }): void
}

// The Java TaskWorker calls setTaskRunner once at module evaluation. The
// stubbed TaskRunner constructor stands in for the NativeScript-generated
// interface proxy: it returns the implementation the worker will call.
const APP_CONTEXT = { kind: 'android-app-context' }

function fixture({ withClass = true } = {}) {
  let runner: TaskRunnerImpl | null = null
  const scheduled: unknown[][] = []
  const cancelled: unknown[][] = []
  const context = vm.createContext({
    isIOS: false,
    Utils: { android: { getApplicationContext: () => APP_CONTEXT } },
    ...(withClass
      ? {
          com: {
            octanexplat: {
              tasks: {
                TaskWorker: {
                  TaskRunner: class TaskRunner {
                    constructor(impl: TaskRunnerImpl) {
                      return impl
                    }
                  },
                  setTaskRunner(r: TaskRunnerImpl) {
                    runner = r
                  },
                },
                TaskScheduler: {
                  schedule(...args: unknown[]) {
                    scheduled.push(args)
                  },
                  cancel(...args: unknown[]) {
                    cancelled.push(args)
                  },
                },
              },
            },
          },
        }
      : {}),
  })
  const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', context)

  return {
    leaf,
    scheduled,
    cancelled,
    getRunner: () => runner,
    dispatch(name: string) {
      const results: string[] = []
      const outcome = { onResult: (r: string) => results.push(r) }
      assert.ok(runner, 'module evaluation did not register a TaskRunner')
      const returned = runner!.run(name, outcome)
      return { results, returned }
    },
  }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

test('module evaluation registers the TaskRunner bridge the worker calls', () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  const run = f.dispatch('refresh')
  assert.equal(run.returned, undefined)
})

test('module evaluation without the Android bridge class is a no-op', () => {
  const bare = vm.createContext({ isIOS: false })
  const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', bare)
  assert.equal(leaf.supported, true)
})

test('run() returns before the executor settles — the result rides TaskOutcome', async () => {
  const f = fixture()
  let release: (r: string) => void = () => {}
  f.leaf.defineTask('refresh', () => new Promise<string>((resolve) => (release = resolve)))

  const run = f.dispatch('refresh')
  // The worker cannot learn the outcome from run()'s return value — a
  // pending executor has reported nothing yet.
  assert.equal(run.returned, undefined)
  assert.deepEqual(run.results, [])

  release('success')
  await tick()
  assert.deepEqual(run.results, ['success'])
})

test('the executor result reaches the outcome for success, failure, and throws', async () => {
  const f = fixture()
  f.leaf.defineTask('ok', async () => 'success')
  f.leaf.defineTask('bad', async () => 'failed')
  f.leaf.defineTask('thrown', async () => {
    throw new Error('network down')
  })

  for (const [name, expected] of [
    ['ok', 'success'],
    ['bad', 'failed'],
    ['thrown', 'failed'],
  ] as const) {
    const run = f.dispatch(name)
    await tick()
    assert.deepEqual(run.results, [expected])
  }
})

test('an undefined task reports failed instead of hanging the worker', async () => {
  const f = fixture()
  const run = f.dispatch('ghost')
  await tick()
  assert.deepEqual(run.results, ['failed'])
})

test('a thrown onResult cannot reject the settled run', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  const runner = f.getRunner()
  assert.ok(runner)

  let failure: unknown = null
  const onRejection = (reason: unknown) => (failure = reason)
  process.on('unhandledRejection', onRejection)
  try {
    runner.run('refresh', {
      onResult() {
        throw new Error('worker thread already gone')
      },
    })
    await tick()
  } finally {
    process.off('unhandledRejection', onRejection)
  }
  assert.equal(failure, null)
})

test('register forwards the application context and interval to TaskScheduler', async () => {
  const f = fixture()
  f.leaf.defineTask('refresh', async () => 'success')
  await f.leaf.register('refresh', { minimumInterval: 20 * 60 })
  assert.deepEqual(f.scheduled, [[APP_CONTEXT, 'refresh', 20 * 60]])

  await f.leaf.unregister('refresh')
  assert.deepEqual(f.cancelled, [[APP_CONTEXT, 'refresh']])
})

test('register and unregister skip the scheduler when no app context exists', async () => {
  const context = vm.createContext({
    isIOS: false,
    Utils: { android: {} },
    com: { octanexplat: { tasks: { TaskWorker: {}, TaskScheduler: {} } } },
  })
  const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', context)
  leaf.defineTask('refresh', async () => 'success')
  await leaf.register('refresh')
  await leaf.unregister('refresh')
  assert.equal(await leaf.isRegistered('refresh'), false)
})

test('TaskScheduler.java takes the app context from JS — no com.tns.Utils', () => {
  const source = readFileSync(
    new URL('../platforms/android/java/com/octanexplat/tasks/TaskScheduler.java', import.meta.url),
    'utf8',
  )
  // The pinned @nativescript/android runtime has no com.tns.Utils; the app
  // context arrives from the JS caller like every other leaf's Java bridge.
  assert.doesNotMatch(source, /com\.tns\.Utils|Utils\.getApplicationContext/)
  assert.match(source, /schedule\(Context context, String name, long intervalSeconds\)/)
  assert.match(source, /cancel\(Context context, String name\)/)
})

test('TaskWorker.java bridges through the registered runner and awaits TaskOutcome', () => {
  // The pinned @nativescript/android Runtime exposes no runOnJSThread /
  // CompletionListener, and callJSMethod needs a javaObject with a JS twin —
  // the former global-function dispatch could never reach JS.
  assert.doesNotMatch(WORKER_SOURCE, /runOnJSThread|CompletionListener|callJSMethod/)
  assert.match(WORKER_SOURCE, /interface TaskRunner/)
  assert.match(WORKER_SOURCE, /setTaskRunner/)
  assert.match(WORKER_SOURCE, /CountDownLatch/)
  assert.match(WORKER_SOURCE, /taskRunner\.run\(name, outcome\)/)
  assert.match(WORKER_SOURCE, /outcome\.await\(\)/)
  assert.match(WORKER_SOURCE, /"success"\.equals\(outcome\.result\(\)\) \? Result\.success\(\) : Result\.retry\(\)/)
})
