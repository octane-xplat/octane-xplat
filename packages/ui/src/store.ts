/**
 * Module-scope store — the shared-state primitive for this stack.
 *
 * Why it exists: the universal (native) renderer RETAINS child components
 * whose props are shallow-unchanged when a parent re-renders — their render
 * functions do not re-run, so a bare `store.get()` in a child stays stale
 * (the DOM renderer re-invokes them, React-style). The portable rule is:
 * every component that reads shared state subscribes to it. `useStore` (in
 * use-store.{web,native}.tsrx — hooks need renderer-owned files) is that
 * subscription; this file is the hook-free half, so plain `.ts` is correct.
 */
import type { Store } from './props'

export type { ReadableStore, Store } from './props'

export function createStore<T>(initial: T): Store<T> {
	let value = initial
	const listeners = new Set<() => void>()
	return {
		get: () => value,
		set(next) {
			const v = typeof next === 'function' ? (next as (p: T) => T)(value) : next
			if (Object.is(v, value)) {
				return
			}

			value = v
			for (const l of [...listeners]) {
				l()
			}
		},
		subscribe(notify) {
			listeners.add(notify)
			return () => {
				listeners.delete(notify)
			}
		},
	}
}
