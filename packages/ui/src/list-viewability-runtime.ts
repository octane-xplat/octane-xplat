import type { ListViewabilityConfig, ListViewabilityInfo } from './props'
import type { VisibleListRow } from './list-viewability-core'

export interface PlatformListRuntime<T = any> {
	list: { current: any }
	items: { current: T[] }
	config: { current?: ListViewabilityConfig }
	onChange: { current?: (info: ListViewabilityInfo<T>) => void }
}

/** NativeScript's public list methods silently ignore unmounted targets; the
 *  shared handle also treats invalid indices as safe no-ops on both OSes. */
export function scrollListToIndex(
	list: any,
	index: number | undefined,
	itemsLength: number,
	animated = false,
): void {
	if (!list || !Number.isInteger(index) || index! < 0 || index! >= itemsLength) {
		return
	}

	if (animated) {
		list.scrollToIndexAnimated(index)
	} else {
		list.scrollToIndex(index)
	}
}

export interface ListVisibilityState<T = any> {
	items: readonly T[]
	config?: ListViewabilityConfig
	update: (
		rows: readonly VisibleListRow[],
		items: readonly T[],
		config?: ListViewabilityConfig,
	) => void
}

export interface ListVisibilityObserver {
	refresh(): void
	dispose(): void
}
