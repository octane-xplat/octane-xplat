/**
 * Module-scope store — the shared-state primitive for this stack.
 *
 * Why it exists: the universal (native) renderer RETAINS child components
 * whose props are shallow-unchanged when a parent re-renders — their render
 * functions do not re-run, so a bare `store.getSnapshot()` in a child stays stale
 * (the DOM renderer re-invokes them, React-style). The portable rule is:
 * every component that reads shared state subscribes to it. The renderer-owned
 * `use-store` leaves implement that subscription; this file is the hook-free
 * half, so plain `.ts` is correct.
 */
import type { Store, StoreSnapshot } from './props'

export type { ReadableStore, Store, StoreSnapshot } from './props'

export function createStore<T>(initial: T): Store<T> {
	let value = initial
	const listeners = new Set<() => void>()
	const commit = (next: T) => {
		if (Object.is(next, value)) {
			return
		}

		value = next
		for (const l of [...listeners]) {
			l()
		}
	}

	return {
		getSnapshot: () => value as StoreSnapshot<T>,
		set: commit,
		update(updater) {
			commit(updater(value as StoreSnapshot<T>))
		},
		subscribe(notify) {
			listeners.add(notify)
			return () => {
				listeners.delete(notify)
			}
		},
	}
}
