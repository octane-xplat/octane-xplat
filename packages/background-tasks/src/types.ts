/** Reported outcome of a task run — the OS uses it for scheduling heuristics
 *  (repeated 'failed' runs get deferred on both stores). */
export type TaskResult = 'success' | 'failed'

/** Invocation payload handed to a TaskExecutor. */
export interface TaskContext {
  /** The registered task name — one executor may serve several names. */
  name: string
  /** true once the OS has reclaimed the run's time budget (the iOS
   *  expiration handler). Cancellation is cooperative: the executor cannot
   *  be preempted, so check this between awaits and resolve promptly. The
   *  task is already being completed as failed — a late result is
   *  discarded. Always false on platforms without an expiration concept. */
  readonly expired: boolean
}

/** The task body; resolves 'success' | 'failed' for OS scheduling feedback. */
export type TaskExecutor = (context: TaskContext) => Promise<TaskResult>

/** OS willingness to run background tasks — 'restricted' means the user or
 *  a battery/data saver mode has throttled them; 'unavailable' means the
 *  platform has no background-task path at all. */
export type TaskStatus = 'available' | 'restricted' | 'unavailable'

/** Background-task façade. Tasks are defined at module scope, then
 *  enabled/disabled against the OS scheduler (iOS BGTaskScheduler /
 *  Android WorkManager-style periodic work). Intervals are minimums — the OS
 *  decides actual timing. */
export interface BackgroundTasks {
  /** Synchronous fast check — a background-task scheduler exists. */
  readonly supported: boolean
  /** Define a task at module scope — the OS may invoke the name before any
   *  other call, so registration must be load-time (expo-task-manager's
   *  structural constraint, mirrored deliberately). On iOS this is also
   *  Apple's launch-handler registration, which must finish before app
   *  launch completes and is registered once per task for the process'
   *  lifetime — module scope is what makes both requirements safe. */
  defineTask(name: string, executor: TaskExecutor): void
  /** Enable or reschedule a defined task by submitting the next refresh
   *  request. Idempotent — a repeated call replaces the pending request, so
   *  it is safe to call at every launch or from an enable action. iOS
   *  requests are single-shot: the scheduler resubmits after each run while
   *  the task stays enabled. `minimumInterval` is a hint in scheduler units
   *  (seconds on iOS via earliestBeginDate) — the OS decides actual timing
   *  and may defer well past it. */
  register(name: string, options?: { minimumInterval?: number }): Promise<void>
  /** Cancel a previously enabled task's pending request; no-op when not
   *  enabled. Does not interrupt an executor already running. */
  unregister(name: string): Promise<void>
  /** Current OS scheduling posture for this app. */
  getStatus(): Promise<TaskStatus>
  /** Whether `name` is enabled in this process — an in-memory record, not a
   *  query of the OS's durable request queue. */
  isRegistered(name: string): Promise<boolean>
}

export declare const backgroundTasks: BackgroundTasks
