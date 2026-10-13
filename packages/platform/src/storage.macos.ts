import { host } from './appkit-host'

const hostStorage = new Map<string, string>()

let lifecycleArmed = false

/** Flush pending writes when the host goes inactive — the macOS
 *  counterpart of the native leaf's suspend/exit flush. Arms lazily on
 *  the first write because `__xplatAppKit` may install after import, and
 *  stays unarmed when the host has no durable storage to flush. */
function armLifecycleFlush(): void {
	if (lifecycleArmed) {
		return
	}

	const { onAppStateChange, storageFlush } = host()
	if (!onAppStateChange || !storageFlush) {
		return
	}

	lifecycleArmed = true
	onAppStateChange(() => {
		if (host().appState !== 'active') {
			storage.flush()
		}
	})
}

/** Sync KV seam — the AppKit host's storage hooks (NSUserDefaults in the
 *  stock host) with an in-memory Map fallback when no host is installed.
 *  The fallback is session-only: flush() reports false there rather than
 *  claim durability it cannot provide. */
export const storage = {
	getString(key: string): string | null {
		return host().storageGet?.(key) ?? hostStorage.get(key) ?? null
	},
	setString(key: string, value: string): void {
		armLifecycleFlush()
		const set = host().storageSet
		if (set) {
			set(key, value)
			return
		}

		hostStorage.set(key, value)
	},
	remove(key: string): void {
		armLifecycleFlush()
		const remove = host().storageRemove
		if (remove) {
			remove(key)
			return
		}

		hostStorage.delete(key)
	},
	/** Deliver pending writes to the host's durable store, returning its
	 *  confirmation. A host whose synchronous set/remove hooks already hand
	 *  each write off reports true; the session-only Map fallback reports
	 *  false — there is nothing it can flush to. */
	flush(): boolean {
		const storageFlush = host().storageFlush
		if (storageFlush) {
			return storageFlush()
		}

		return Boolean(host().storageSet)
	},
}
