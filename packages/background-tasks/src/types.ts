export type TaskResult = 'success' | 'failed'

export interface TaskContext {
	name: string
}

export type TaskExecutor = (context: TaskContext) => Promise<TaskResult>

export type TaskStatus = 'available' | 'restricted' | 'unavailable'

export interface BackgroundTasks {
	readonly supported: boolean
	/** Define a task at module scope — the OS may invoke the name before any
	 *  other call, so registration must be load-time (expo-task-manager's
	 *  structural constraint, mirrored deliberately). */
	defineTask(name: string, executor: TaskExecutor): void
	register(name: string, options?: { minimumInterval?: number }): Promise<void>
	unregister(name: string): Promise<void>
	getStatus(): Promise<TaskStatus>
	isRegistered(name: string): Promise<boolean>
}

export declare const backgroundTasks: BackgroundTasks
