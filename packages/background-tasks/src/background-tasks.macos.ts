// Background tasks — AppKit leaf over NSBackgroundActivityScheduler. The
// scheduler is deferrable maintenance work: `interval` is a request the OS
// may stretch, the app must be running (no launch-on-event), and a deferred
// fire surfaces TaskResult through the executor's completion.
import { NSBackgroundActivityScheduler } from '@octane-xplat/platform/macos'
import type { BackgroundTasks, TaskExecutor, TaskResult, TaskStatus } from './types'

// NSBackgroundActivityResult: 1 deferred, 2 finished.
const RESULT_FINISHED = 2
const RESULT_DEFERRED = 1

const executors = new Map<string, TaskExecutor>()
const schedulers = new Map<string, any>()

const schedulerClass = (): any => {
	try {
		return typeof NSBackgroundActivityScheduler?.alloc === 'function'
			? NSBackgroundActivityScheduler
			: null
	} catch {
		return null
	}
}

/** Background-task scheduler service — see BackgroundTasks for the contract. */
export const backgroundTasks: BackgroundTasks = {
	get supported() {
		return schedulerClass() !== null
	},

	defineTask(name: string, executor: TaskExecutor): void {
		executors.set(name, executor)
	},

	register: async (name: string, options?: { minimumInterval?: number }): Promise<void> => {
		if (!executors.has(name)) {
			throw new Error(`backgroundTasks.register: no task defined as '${name}'`)
		}

		const klass = schedulerClass()
		if (!klass) {
			throw new Error('backgroundTasks.register: NSBackgroundActivityScheduler is unavailable')
		}

		backgroundTasks.unregister(name).catch(() => {})
		const scheduler = klass.alloc().initWithIdentifier(`xplat.background.${name}`)
		scheduler.repeats = true
		scheduler.interval = Math.max(options?.minimumInterval ?? 3600, 60)
		scheduler.tolerance = scheduler.interval / 2
		scheduler.qualityOfService = 0x09 // NSQualityOfServiceBackground
		scheduler.scheduleWithBlock((completion: (result: number) => void) => {
			const executor = executors.get(name)
			if (scheduler.shouldDefer || !executor) {
				completion(RESULT_DEFERRED)
				return
			}

			Promise.resolve()
				.then(() => executor({ name }))
				.then((result: TaskResult) => completion(result === 'success' ? RESULT_FINISHED : RESULT_DEFERRED))
				.catch(() => completion(RESULT_DEFERRED))
		})
		schedulers.set(name, scheduler)
	},

	unregister: async (name: string): Promise<void> => {
		const scheduler = schedulers.get(name)
		if (scheduler) {
			schedulers.delete(name)
			try {
				scheduler.invalidate()
			} catch {
				// Invalidating a released scheduler must not poison unregister.
			}
		}
	},

	getStatus: async (): Promise<TaskStatus> =>
		schedulerClass() ? 'available' : 'unavailable',

	isRegistered: async (name: string): Promise<boolean> => schedulers.has(name),
}
