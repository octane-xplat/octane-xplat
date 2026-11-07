// Background tasks — native leaf, custom bridge (no NS plugin exists).
// iOS: BGTaskScheduler app-refresh requests; the Info.plist registers the
// task identifier and UIBackgroundModes fetch. Android: WorkManager periodic
// requests through platforms/android Gradle deps; the Worker dispatches to
// the TaskRunner registered below while a runtime is warm.
//
// defineTask bodies must be registered at module scope — the OS can invoke a
// task before app code runs again, and a relaunch only re-evaluates module
// top-level. That placement is also Apple's registration window: launch
// handlers must be registered before app launch finishes, and a second
// registration of the same identifier kills the app. defineTask therefore
// owns iOS handler registration (once per identifier); register/unregister
// only submit or cancel refresh requests and are safe to repeat.
import { isIOS, Utils } from '@nativescript/core'
import type { BackgroundTasks, TaskContext, TaskExecutor, TaskResult, TaskStatus } from './types'

declare const BGTaskScheduler: any
declare const BGAppRefreshTaskRequest: any
declare const interop: any

const executors = new Map<string, TaskExecutor>()
const registered = new Map<string, number>()
const handledIdentifiers = new Set<string>()
const handlerReady = new Set<string>()

const TASK_PREFIX = 'com.octanexplat.tasks.'

async function runTask(name: string, context: TaskContext): Promise<TaskResult> {
  const executor = executors.get(name)
  if (!executor) {
    return 'failed'
  }
  try {
    return (await executor(context)) ?? 'success'
  } catch {
    return 'failed'
  }
}

// iOS: submit (or replace) the pending refresh request for a task. Each
// request is consumed by one run, so enable/reschedule and the post-run
// resubmission share this path. Cancelling first keeps repeated calls
// idempotent — submitting over a pending request can fail with
// BGTaskSchedulerErrorCodeTooManyPendingTaskRequests. Submitting without a
// registered launch handler is not a soft failure: BGTaskScheduler raises an
// uncatchable NSInternalInconsistencyException that kills the process, so the
// ready check is a hard gate.
function iosSubmit(name: string): void {
  const identifier = TASK_PREFIX + name
  if (!handlerReady.has(name)) {
    throw new Error(
      `backgroundTasks.register: '${name}' has no registered iOS launch handler — ` +
        `its defineTask must run at module scope so registration finishes before app launch completes`,
    )
  }
  BGTaskScheduler.sharedScheduler.cancelTaskRequestWithIdentifier(identifier)

  const request = BGAppRefreshTaskRequest.alloc().initWithIdentifier(identifier)
  const interval = registered.get(name)
  if (interval) {
    request.earliestBeginDate = (globalThis as any).NSDate.dateWithTimeIntervalSinceNow(interval)
  }

  const errorRef = typeof interop !== 'undefined' ? new interop.Reference() : null
  const submitted = BGTaskScheduler.sharedScheduler.submitTaskRequestError(request, errorRef)
  if (!submitted) {
    const detail = errorRef?.value?.localizedDescription ?? 'unknown scheduler error'
    throw new Error(
      `backgroundTasks.register: refresh request for '${name}' was rejected — ${detail}. ` +
        `Confirm ${identifier} is in BGTaskSchedulerPermittedIdentifiers and UIBackgroundModes includes fetch`,
    )
  }
}

// iOS BGTaskScheduler launch handler — the OS calls the registered handler on
// a background thread; we resolve via the JS executor, report its real outcome
// then resubmit the request while the task stays registered. Completion and
// expiration funnel through one flag: whichever reaches the OS first marks the
// task exactly once, and a late executor result is discarded.
function iosHandle(task: any): void {
  const identifier: string = task?.identifier ?? ''
  const name = identifier.startsWith(TASK_PREFIX)
    ? identifier.slice(TASK_PREFIX.length)
    : identifier

  let expired = false
  let completed = false
  const complete = (success: boolean) => {
    if (completed) {
      return
    }
    completed = true
    try {
      task.setTaskCompletedWithSuccess(success)
    } catch {}
    // Requests are single-shot — this run consumed it. Resubmit while the
    // task stays registered so refresh recurs; a run that ended by
    // expiration still leaves the schedule alive.
    if (registered.has(name)) {
      try {
        iosSubmit(name)
      } catch {}
    }
  }

  task.expirationHandler = () => {
    expired = true
    // The OS is reclaiming the run. The executor may still be mid-flight —
    // signal it cooperatively and complete now; waiting for it risks the
    // process being terminated with the task never marked finished.
    complete(false)
  }

  const context: TaskContext = {
    name,
    get expired() {
      return expired
    },
  }
  runTask(name, context).then(
    (result) => complete(result === 'success'),
    () => complete(false),
  )
}

/** Background-task scheduler service — see BackgroundTasks for the contract. */
export const backgroundTasks: BackgroundTasks = {
  supported: isIOS ? typeof BGTaskScheduler !== 'undefined' : true,

  defineTask(name: string, executor: TaskExecutor): void {
    executors.set(name, executor)
    // iOS: Apple's launch-handler registration. Module scope is already the
    // contract, which is exactly Apple's "before app launch finishes" window.
    // Registration is once per identifier — a second registration of the
    // same identifier kills the app, so a failure is never retried. An
    // "already registered" failure still marks the identifier ready: a module
    // re-eval (hot reload) finds the handler the first evaluation registered.
    if (isIOS && typeof BGTaskScheduler !== 'undefined' && !handledIdentifiers.has(name)) {
      handledIdentifiers.add(name)
      try {
        const registeredHandler =
          BGTaskScheduler.sharedScheduler.registerForTaskWithIdentifierUsingQueueLaunchHandler(
            TASK_PREFIX + name,
            null,
            iosHandle,
          )

        if (registeredHandler) {
          handlerReady.add(name)
        }
      } catch (error) {
        if (/already been registered/i.test(String(error))) {
          handlerReady.add(name)
        }
      }
    }
  },

  async register(name: string, options?: { minimumInterval?: number }): Promise<void> {
    if (!executors.has(name)) {
      throw new Error(
        `backgroundTasks.register: '${name}' has no defineTask — declare it at module scope`,
      )
    }
    if (isIOS) {
      if (typeof BGTaskScheduler === 'undefined') {
        throw new Error('unsupported: BGTaskScheduler is not available')
      }

      registered.set(name, options?.minimumInterval ?? 0)
      try {
        iosSubmit(name)
      } catch (error) {
        registered.delete(name)
        throw error
      }

      return
    }
    // Android: WorkManager — the Java side reads the registered map off the
    // global so a cold start rebuilds scheduled work from defineTask calls.
    // `Utils.android` is a {} stub off Android, so the context stays absent
    // and scheduling is skipped there.
    const worker = (globalThis as any).com?.octanexplat?.tasks?.TaskScheduler
    const context = (Utils.android as any)?.getApplicationContext?.()
    if (worker?.schedule && context) {
      worker.schedule(context, name, options?.minimumInterval ?? 0)
    }
    registered.set(name, options?.minimumInterval ?? 0)
  },

  async unregister(name: string): Promise<void> {
    registered.delete(name)
    if (isIOS) {
      BGTaskScheduler.sharedScheduler?.cancelTaskRequestWithIdentifier?.(TASK_PREFIX + name)
      return
    }
    const worker = (globalThis as any).com?.octanexplat?.tasks?.TaskScheduler
    const context = (Utils.android as any)?.getApplicationContext?.()
    if (context) {
      worker?.cancel?.(context, name)
    }
  },

  async getStatus(): Promise<TaskStatus> {
    if (isIOS) {
      if (typeof BGTaskScheduler === 'undefined') {
        return 'unavailable'
      }

      const status = (globalThis as any).UIApplication?.sharedApplication?.backgroundRefreshStatus
      // UIBackgroundRefreshStatus: 0 restricted, 1 denied, 2 available
      return status === 0 || status === 1 ? 'restricted' : 'available'
    }
    return 'available'
  },

  async isRegistered(name: string): Promise<boolean> {
    return registered.has(name)
  },
}

// Worker → JS entry. Android's TaskWorker invokes the TaskRunner registered
// at module evaluation — calls from the worker thread dispatch onto the JS
// thread, then the worker blocks on TaskOutcome until the executor settles.
const taskWorker = (globalThis as any).com?.octanexplat?.tasks?.TaskWorker
if (!isIOS && typeof taskWorker?.setTaskRunner === 'function') {
  taskWorker.setTaskRunner(
    new taskWorker.TaskRunner({
      run(name: string, outcome: { onResult(r: string): void }) {
        const report = (r: string) => {
          try {
            outcome.onResult(r)
          } catch {}
        }
        runTask(name, { name, expired: false }).then(report, () => report('failed'))
      },
    }),
  )
}
