import type {
	ListViewabilityConfig,
	ListViewabilityInfo,
	ListViewabilityChange,
	ListVisibleItem,
} from './props'

export interface VisibleListRow {
	index: number
	visiblePercent: number
}

/** Tracks logical rows after each platform observer measures actual viewport
 *  intersections. A native cell can be reused; index plus current item is the
 *  identity exposed to callers. */
export function createListViewabilityTracker<T>() {
	const active = new Map<number, T>()
	const pending = new Map<
		number,
		{ item: T; minimumViewTime: number; timer: ReturnType<typeof setTimeout> }
	>()

	let latestCandidates = new Map<number, T>()
	let latestItems: readonly T[] = []
	let latestCallback: ((info: ListViewabilityInfo<T>) => void) | undefined
	let disposed = false

	function emit(changed: ListViewabilityChange<T>[]) {
		if (!changed.length || disposed) {
			return
		}

		changed.sort((a, b) => a.index - b.index || Number(a.isViewable) - Number(b.isViewable))
		const viewableItems: ListVisibleItem<T>[] = [...active]
			.sort(([a], [b]) => a - b)
			.map(([index, item]) => ({ index, item }))

		latestCallback?.({ viewableItems, changed })
	}

	function update(
		rows: readonly VisibleListRow[],
		items: readonly T[],
		config: ListViewabilityConfig | undefined,
		callback: ((info: ListViewabilityInfo<T>) => void) | undefined,
	) {
		if (disposed) {
			return
		}

		latestItems = items
		latestCallback = callback
		const threshold = Math.max(0, Math.min(100, config?.itemVisiblePercentThreshold ?? 50))
		const minimumViewTime = Math.max(0, config?.minimumViewTime ?? 250)
		const candidates = new Map<number, T>()
		for (const row of rows) {
			if (
				Number.isInteger(row.index) &&
				row.index >= 0 &&
				row.index < items.length &&
				row.visiblePercent > 0 &&
				row.visiblePercent >= threshold
			) {
				candidates.set(row.index, items[row.index])
			}
		}

		latestCandidates = candidates

		const changed: ListViewabilityChange<T>[] = []
		for (const [index, item] of active) {
			if (!candidates.has(index) || !Object.is(candidates.get(index), item)) {
				active.delete(index)
				changed.push({ index, item, isViewable: false })
			}
		}

		for (const [index, waiting] of pending) {
			if (
				!candidates.has(index) ||
				!Object.is(candidates.get(index), waiting.item) ||
				waiting.minimumViewTime !== minimumViewTime
			) {
				clearTimeout(waiting.timer)
				pending.delete(index)
			}
		}

		for (const [index, item] of candidates) {
			if ((active.has(index) && Object.is(active.get(index), item)) || pending.has(index)) {
				continue
			}

			if (minimumViewTime === 0) {
				active.set(index, item)
				changed.push({ index, item, isViewable: true })
				continue
			}

			const timer = setTimeout(() => {
				pending.delete(index)
				if (
					disposed ||
					!latestCandidates.has(index) ||
					!Object.is(latestCandidates.get(index), item) ||
					!Object.is(latestItems[index], item)
				) {
					return
				}

				active.set(index, item)
				emit([{ index, item, isViewable: true }])
			}, minimumViewTime)

			pending.set(index, { item, minimumViewTime, timer })
		}

		emit(changed)
	}

	function dispose() {
		disposed = true
		for (const { timer } of pending.values()) {
			clearTimeout(timer)
		}

		pending.clear()
		active.clear()
		latestCandidates.clear()
	}

	return { update, dispose }
}
