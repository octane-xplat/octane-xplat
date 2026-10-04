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
): boolean {
	if (
		!list ||
		list.isLoaded === false ||
		!Number.isInteger(index) ||
		index! < 0 ||
		index! >= itemsLength
	) {
		return false
	}

	if (animated) {
		list.scrollToIndexAnimated(index)
	} else {
		list.scrollToIndex(index)
	}

	return true
}

/** Applies an initial index once per list and requested target. Invalid or
 *  not-yet-available targets remain eligible when the list's data arrives. */
export function createInitialListScrollRestorer() {
	let lastList: any = null
	let lastTarget: number | undefined
	let hasTarget = false
	let applied = false

	return {
		tryScroll(list: any, target: number | undefined, itemsLength: number) {
			if (list !== lastList || !hasTarget || target !== lastTarget) {
				lastList = list
				lastTarget = target
				hasTarget = true
				applied = false
			}

			if (applied || !scrollListToIndex(list, target, itemsLength)) {
				return false
			}

			applied = true
			return true
		},
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

/** Keeps native peer observation aligned with NativeScript's View lifecycle.
 *  Effects may run before `loaded`; the lifecycle listener attaches later and
 *  handles peer replacement without replacing NativeScript's own delegates. */
export function observeLoadedListPeer<T>(
	list: any,
	getPeer: () => T | null | undefined,
	attach: (peer: T) => ListVisibilityObserver,
	reset: () => void,
): ListVisibilityObserver {
	let peer: T | null = null
	let nativeObserver: ListVisibilityObserver | null = null
	let disposed = false

	const detach = () => {
		const current = nativeObserver
		nativeObserver = null
		peer = null
		current?.dispose()
		reset()
	}

	const attachPeer = () => {
		if (disposed) {
			return
		}

		if (list?.isLoaded === false) {
			return
		}

		const next = getPeer()
		if (next == null || next === peer) {
			return
		}

		if (nativeObserver !== null || peer !== null) {
			detach()
		}

		peer = next
		nativeObserver = attach(next)
	}

	const onLoaded = () => {
		attachPeer()
		nativeObserver?.refresh()
	}

	const onUnloaded = () => detach()
	const onLayoutChanged = () => {
		attachPeer()
		nativeObserver?.refresh()
	}

	list?.on?.('loaded', onLoaded)
	list?.on?.('unloaded', onUnloaded)
	list?.on?.('layoutChanged', onLayoutChanged)
	attachPeer()

	return {
		refresh() {
			attachPeer()
			nativeObserver?.refresh()
		},
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			list?.off?.('loaded', onLoaded)
			list?.off?.('unloaded', onUnloaded)
			list?.off?.('layoutChanged', onLayoutChanged)
			detach()
		},
	}
}
