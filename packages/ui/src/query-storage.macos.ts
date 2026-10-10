import type { QueryStorageAdapter } from './query-cache'

interface XplatAppKitStorage {
	storageGet?: (key: string) => string | null
	storageSet?: (key: string, value: string) => void
	storageRemove?: (key: string) => void
}

const host = () => (globalThis as { __xplatAppKit?: XplatAppKitStorage }).__xplatAppKit

const memoryStorage = new Map<string, string>()

/**
 * Default query persistence adapter on macOS — the AppKit host's
 * `__xplatAppKit` storage bridge, backed by `NSUserDefaults` in the stock
 * harness (`apps/macos`). Synchronous and suitable for bounded JSON
 * snapshots; keep persisted query payloads small. Falls back to
 * process-only memory for each missing bridge method, so a host without
 * the bridge keeps working but does not persist across restarts.
 */
export const platformQueryStorage: QueryStorageAdapter = {
	get: (key) => {
		try {
			return host()?.storageGet?.(key) ?? memoryStorage.get(key) ?? null
		} catch {
			return null
		}
	},
	set: (key, value) => {
		try {
			const set = host()?.storageSet
			if (set) {
				set(key, value)
				return
			}

			memoryStorage.set(key, value)
		} catch {
			// Persistence is best-effort.
		}
	},
	remove: (key) => {
		try {
			const remove = host()?.storageRemove
			if (remove) {
				remove(key)
				return
			}

			memoryStorage.delete(key)
		} catch {
			// Persistence is best-effort.
		}
	},
}
