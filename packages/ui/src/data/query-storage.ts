import { ApplicationSettings } from '@nativescript/core'
import type { QueryStorageAdapter } from './query-cache'

/**
 * Default query persistence adapter on iOS/Android — NativeScript
 * `ApplicationSettings` (NSUserDefaults/SharedPreferences). Synchronous and
 * suitable for bounded JSON snapshots; keep persisted query payloads small.
 * A file-backed adapter remains the upgrade path for larger caches — supply
 * it via `persist.storage`.
 */
export const platformQueryStorage: QueryStorageAdapter = {
	get: (key) => {
		try {
			return ApplicationSettings.getString(key) ?? null
		} catch {
			return null
		}
	},
	set: (key, value) => {
		try {
			ApplicationSettings.setString(key, value)
		} catch {
			// Persistence is best-effort.
		}
	},
	remove: (key) => {
		try {
			ApplicationSettings.remove(key)
		} catch {
			// Persistence is best-effort.
		}
	},
}
