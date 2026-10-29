import type { QueryStorageAdapter } from './query-cache'

interface XplatAppKitStorage {
	storageGet?: (key: string) => string | null
	storageSet?: (key: string, value: string) => void
	storageRemove?: (key: string) => void
}

const host = () => (globalThis as { __xplatAppKit?: XplatAppKitStorage }).__xplatAppKit
const memoryStorage = new Map<string, string>()
const hostMemory = new WeakMap<XplatAppKitStorage, Map<string, string>>()
let nativeStorageObserved = false

function memory(owner: XplatAppKitStorage | undefined): Map<string, string> {
	if (!owner) return memoryStorage
	// Never revive pre-host cache entries after the host later disappears.
	memoryStorage.clear()
	if (typeof owner.storageGet === 'function' || typeof owner.storageSet === 'function' ||
		typeof owner.storageRemove === 'function') nativeStorageObserved = true
	let values = hostMemory.get(owner)
	if (!values) {
		values = new Map()
		hostMemory.set(owner, values)
	}
	if (complete(owner)) values.clear()
	return values
}

/** Bounded JSON query snapshots through the AppKit defaults bridge. Query
 *  restore/writes are best effort; purge must observe native read/remove failure.
 *  A partial bridge uses one isolated memory cache, never a mix of stores. */
export const platformQueryStorage: QueryStorageAdapter = {
	get: (key) => {
		const owner = host()
		const values = memory(owner)
		try {
			// Only a complete bridge can safely persist and later purge a record.
			return complete(owner) ? owner.storageGet(key) ?? null : values.get(key) ?? null
		} catch {
			// Restore catches this; purge must not confuse a failed index read with absence.
			throw new Error('AppKit query storage read failed')
		}
	},
	set: (key, value) => {
		const owner = host()
		const values = memory(owner)
		try {
			if (complete(owner)) {
				owner.storageSet(key, value)
				values.delete(key)
			} else {
				values.set(key, value)
			}
		} catch {
			// Query data remains usable in the query client's memory.
		}
	},
	remove: (key) => {
		const owner = host()
		const values = memory(owner)
		// Even a partial host may have durable records from an earlier run.
		// Do not resolve a sign-out purge after deleting only a memory mirror.
		if (typeof owner?.storageRemove === 'function') {
			try {
				owner.storageRemove(key)
			} catch {
				throw new Error('AppKit query storage removal failed')
			}
		}
		if (nativeStorageObserved && !complete(owner)) {
			throw new Error('AppKit query storage cannot confirm removal with an incomplete bridge')
		}
		values.delete(key)
	},
}

function complete(owner: XplatAppKitStorage | undefined): owner is Required<XplatAppKitStorage> {
	return !!owner && typeof owner.storageGet === 'function' &&
		typeof owner.storageSet === 'function' && typeof owner.storageRemove === 'function'
}
