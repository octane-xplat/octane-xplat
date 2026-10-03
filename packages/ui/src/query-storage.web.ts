import type { QueryStorageAdapter } from './query-cache'

/**
 * Default query persistence adapter on web — `window.localStorage`.
 * Synchronous, shared per origin, and bounded to JSON text payloads; apps
 * needing larger or structured snapshots can supply an idb-keyval-style
 * `QueryStorageAdapter` to `persist.storage` instead.
 */
export const platformQueryStorage: QueryStorageAdapter = {
	get: (key) => {
		try {
			return window.localStorage.getItem(key)
		} catch {
			return null
		}
	},
	set: (key, value) => {
		try {
			window.localStorage.setItem(key, value)
		} catch {
			// Persistence is best-effort.
		}
	},
	remove: (key) => {
		try {
			window.localStorage.removeItem(key)
		} catch {
			// Persistence is best-effort.
		}
	},
}
