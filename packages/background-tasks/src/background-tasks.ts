// Background tasks — native leaf, custom bridge (no NS plugin exists).
// iOS: BGTaskScheduler app-refresh requests; the Info.plist registers the
// task identifier and UIBackgroundModes fetch. Android: WorkManager periodic
// requests through platforms/android Gradle deps; the Worker spins up the
// runtime and calls back into __xplatBackgroundTaskRun.
//
// defineTask bodies must be registered at module scope — the OS can invoke a
// task before app code runs again, and a relaunch only re-evaluates module
// top-level. expo-task-manager's constraint, mirrored deliberately.
import { Application, Utils, isIOS } from '@nativescript/core'
import type { BackgroundTasks, TaskExecutor, TaskResult, TaskStatus } from './types'

declare const BGTaskScheduler: any
declare const BGAppRefreshTaskRequest: any

const executors = new Map<string, TaskExecutor>()
const registered = new Map<string, number>()

const TASK_PREFIX = 'com.octanexplat.tasks.'

async function runTask(name: string): Promise<TaskResult> {
	const executor = executors.get(name)
	if (!executor) {
		return 'failed'
	}
	try {
		return (await executor({ name })) ?? 'success'
	} catch {
		return 'failed'
	}
}

// iOS BGTaskScheduler launch handler — the OS calls the registered handler on
// a background thread; we resolve via the JS executor then mark completion.
function iosHandle(task: any): void {
	const identifier: string = task?.identifier ?? ''
	const name = identifier.startsWith(TASK_PREFIX)
		? identifier.slice(TASK_PREFIX.length)
		: identifier
	task.expirationHandler = () => {}
	runTask(name).finally(() => {
		try {
			task.setTaskCompletedWithSuccess(true)
		} catch {}
	})
}

export const backgroundTasks: BackgroundTasks = {
	supported: isIOS ? typeof BGTaskScheduler !== 'undefined' : true,

	defineTask(name: string, executor: TaskExecutor): void {
		executors.set(name, executor)
	},

	async register(name: string, options?: { minimumInterval?: number }): Promise<void> {
		if (!executors.has(name)) {
			throw new Error(
				`backgroundTasks.register: '${name}' has no defineTask — declare it at module scope`,
			)
		}
		registered.set(name, options?.minimumInterval ?? 0)
		if (isIOS) {
			if (typeof BGTaskScheduler === 'undefined') {
				throw new Error('unsupported: BGTaskScheduler is not available')
			}

			const identifier = TASK_PREFIX + name
			BGTaskScheduler.sharedScheduler.registerForTaskWithIdentifierLaunchHandler(
				identifier,
				null,
				iosHandle,
			)

			const request = BGAppRefreshTaskRequest.alloc().initWithIdentifier(identifier)
			const interval = options?.minimumInterval
			if (interval) {
				request.earliestBeginDate = (globalThis as any).NSDate.dateWithTimeIntervalSinceNow(
					interval,
				)
			}

			BGTaskScheduler.sharedScheduler.submitTaskRequestError(request, null)
			return
		}
		// Android: WorkManager — the Java side reads the registered map off the
		// global so a cold start rebuilds scheduled work from defineTask calls.
		const worker = (globalThis as any).com?.octanexplat?.tasks?.TaskScheduler
		if (worker?.schedule) {
			worker.schedule(name, options?.minimumInterval ?? 0)
		}
	},

	async unregister(name: string): Promise<void> {
		registered.delete(name)
		if (isIOS) {
			BGTaskScheduler.sharedScheduler?.cancelTaskRequestWithIdentifier?.(TASK_PREFIX + name)
			return
		}
		const worker = (globalThis as any).com?.octanexplat?.tasks?.TaskScheduler
		worker?.cancel?.(name)
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

// Worker → JS entry. platforms/android's TaskWorker calls this after bringing
// the runtime up; buffered invocations replay once an executor exists.
;(globalThis as any).__xplatBackgroundTaskRun = (name: string, done: (r: string) => void) => {
	runTask(name).then(
		(r) => done(r),
		() => done('failed'),
	)
}
