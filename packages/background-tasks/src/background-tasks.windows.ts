// Unsupported leaf — platform-specific schedulers (NSBackgroundActivityScheduler
// on macOS) are follow-ups; the API surface stands.
import type { BackgroundTasks, TaskStatus } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: background tasks are not wired on this platform'))

/** Background-task scheduler service — see BackgroundTasks for the contract. */
export const backgroundTasks: BackgroundTasks = {
	supported: false,
	defineTask: () => {},
	register: unsupported,
	unregister: unsupported,
	getStatus: async (): Promise<TaskStatus> => 'unavailable',
	isRegistered: async () => false,
}
