import { useSyncExternalStore } from 'octane';
import type { ReadableStore } from './props';

/**
 * Subscribe the calling component to a module-scope store — the portable
 * shared-state read. On the universal renderer a re-rendering parent retains
 * unchanged-prop children, so a component that reads store state must carry
 * its own subscription; on web this is equally correct (and costs nothing).
 * `select` must return an Object.is-stable value per store state.
 */
export function useStore<T>(store: ReadableStore<T>): T;
export function useStore<T, S>(store: ReadableStore<T>, select: (state: T) => S): S;
export function useStore<T, S>(store: ReadableStore<T>, select?: (state: T) => S): T | S {
	return useSyncExternalStore<T | S>(
		store.subscribe,
		select === undefined ? store.get : () => select(store.get()),
	);
}
