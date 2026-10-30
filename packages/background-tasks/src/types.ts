/** Reported outcome of a task run — the OS uses it for scheduling heuristics
 *  (repeated 'failed' runs get deferred on both stores). */
export type TaskResult = 'success' | 'failed'

/** Invocation payload handed to a TaskExecutor. */
export interface TaskContext {
	/** The registered task name — one executor may serve several names. */
	name: string
}

/** The task body; resolves 'success' | 'failed' for OS scheduling feedback. */
export type TaskExecutor = (context: TaskContext) => Promise<TaskResult>

/** OS willingness to run background tasks — 'restricted' means the user or
 *  a battery/data saver mode has throttled them; 'unavailable' means the
 *  platform has no background-task path at all. */
export type TaskStatus = 'available' | 'restricted' | 'unavailable'

/** Background-task façade. Tasks are defined at module scope, then
 *  registered/unregistered against the OS scheduler (iOS BGTaskScheduler /
 *  Android WorkManager-style periodic work). Intervals are minimums — the OS
 *  decides actual timing. */
export interface BackgroundTasks {
	/** Synchronous fast check — a background-task scheduler exists. */
	readonly supported: boolean
	/** Define a task at module scope — the OS may invoke the name before any
	 *  other call, so registration must be load-time (expo-task-manager's
	 *  structural constraint, mirrored deliberately). */
	defineTask(name: string, executor: TaskExecutor): void
	/** Schedule a defined task. `minimumInterval` is a hint in scheduler units
	 *  (seconds on iOS via earliestBeginDate) — the OS decides actual timing
	 *  and may defer well past it. */
	register(name: string, options?: { minimumInterval?: number }): Promise<void>
	/** Cancel a previously registered task; no-op when not registered. */
	unregister(name: string): Promise<void>
	/** Current OS scheduling posture for this app. */
	getStatus(): Promise<TaskStatus>
	/** Whether `name` is currently scheduled with the OS. */
	isRegistered(name: string): Promise<boolean>
}

export declare const backgroundTasks: BackgroundTasks
