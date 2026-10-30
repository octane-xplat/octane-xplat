// Background tasks — no reliable web equivalent (Periodic Background Sync is
// Chromium-only + requires an installed PWA). Honest unsupported leaf.
import type { BackgroundTasks, TaskStatus } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: no background task API on web'))

/** Background-task scheduler service — see BackgroundTasks for the contract. */
export const backgroundTasks: BackgroundTasks = {
	supported: false,
	defineTask: () => {},
	register: unsupported,
	unregister: unsupported,
	getStatus: async (): Promise<TaskStatus> => 'unavailable',
	isRegistered: async () => false,
}
