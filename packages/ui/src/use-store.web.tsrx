/** @jsxImportSource @octane-xplat/jsx/dom */
import { useRef, useSyncExternalStore } from 'octane'
import type { ReadableStore, StoreSnapshot } from './props'

/**
 * Subscribe the calling component to a module-scope store — the reactive
 * read. `store.getSnapshot()` is the non-reactive one-time read and never
 * subscribes; on the universal renderer a re-rendering parent retains
 * unchanged-prop children, so a component that reads store state must carry
 * its own subscription (on web this is equally correct, and costs nothing).
 *
 * `select` picks the slice this component renders. The component re-renders
 * only when the selected value fails `isEqual` — `Object.is` by default, so
 * `select` must return an `Object.is`-stable value per store state (pick
 * fields, don't build objects). Pass a custom `isEqual` to compare computed
 * selections such as filtered lists.
 */
export function useStore<T>(store: ReadableStore<T>): StoreSnapshot<T>
export function useStore<T, S>(
	store: ReadableStore<T>,
	select: (snapshot: StoreSnapshot<T>) => S,
	isEqual?: (a: S, b: S) => boolean,
): S

export function useStore<T, S>(
	store: ReadableStore<T>,
	select?: (snapshot: StoreSnapshot<T>) => S,
	isEqual: (a: S, b: S) => boolean = Object.is,
): StoreSnapshot<T> | S {
	const memo = useRef<{ select: typeof select; selection: unknown } | null>(null)
	const getSelection = (): StoreSnapshot<T> | S => {
		const next = select === undefined ? store.getSnapshot() : select(store.getSnapshot())
		const last = memo.current
		if (last !== null && last.select === select && isEqual(last.selection as S, next as S)) {
			return last.selection as S
		}

		memo.current = { select, selection: next }
		return next
	}

	return useSyncExternalStore<StoreSnapshot<T> | S>(store.subscribe, getSelection)
}
