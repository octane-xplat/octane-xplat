export type VirtualListKey = string | number

export interface VirtualListRange {
	start: number
	end: number
	top: number
	bottom: number
}

export interface VirtualListEntry<T> {
	item: T
	index: number
	key: VirtualListKey
	rowKey: string
	type: VirtualListKey
	typeKey: string
}

export interface VirtualListSizeRecord {
	width: number
	height: number
}

export const VIRTUAL_LIST_ESTIMATED_ROW_SIZE = 48
export const VIRTUAL_LIST_MIN_TYPE_SAMPLES = 4

export function createVirtualListEntries<T>(
	items: readonly T[],
	keyExtractor: (item: T, index: number) => VirtualListKey,
	getItemType?: (item: T, index: number) => VirtualListKey,
): VirtualListEntry<T>[] {
	const seen = new Set<string>()
	return items.map((item, index) => {
		const key = keyExtractor(item, index)
		const type = getItemType?.(item, index) ?? 'default'
		assertKey(key, 'keyExtractor')
		assertKey(type, 'getItemType')

		const keyToken = JSON.stringify([typeof key, key])
		if (seen.has(keyToken)) {
			throw new Error(`VirtualList keyExtractor returned a duplicate key at index ${index}: ${String(key)}`)
		}

		seen.add(keyToken)

		return {
			item,
			index,
			key,
			type,
			typeKey: JSON.stringify([typeof type, type]),
			rowKey: virtualListRowKey(key, type),
		}
	})
}

export function virtualListMeasurementKey(rowKey: string, hasSeparator: boolean) {
	return rowKey + (hasSeparator ? ':separator' : ':last')
}

export function estimateVirtualListSizes<T>(
	entries: readonly VirtualListEntry<T>[],
	hasSeparator: boolean,
	width: number,
	measurements: ReadonlyMap<string, VirtualListSizeRecord>,
): number[] {
	const totals = new Map<string, { height: number; count: number }>()
	for (const entry of entries) {
		const cacheKey = virtualListMeasurementKey(
			entry.rowKey,
			hasSeparator && entry.index < entries.length - 1,
		)

		const cached = measurements.get(cacheKey)
		if (!cached) {
			continue
		}

		const total = totals.get(entry.typeKey) ?? { height: 0, count: 0 }
		total.height += cached.height
		total.count++
		totals.set(entry.typeKey, total)
	}

	return entries.map((entry) => {
		const cacheKey = virtualListMeasurementKey(
			entry.rowKey,
			hasSeparator && entry.index < entries.length - 1,
		)

		const cached = measurements.get(cacheKey)
		if (
			cached &&
			width > 0 &&
			cached.width > 0 &&
			Math.abs(cached.width - width) < 0.5
		) {
			return cached.height
		}

		const total = totals.get(entry.typeKey)
		return total && total.count >= VIRTUAL_LIST_MIN_TYPE_SAMPLES
			? total.height / total.count
			: VIRTUAL_LIST_ESTIMATED_ROW_SIZE
	})
}

/** Prefix-size index for variable-height rows. Updates and offset lookups are
 *  logarithmic, so measuring a row does not scan the whole data set. */
export class VirtualListSizeIndex {
	private sizes = new Float64Array(0)
	private tree = new Float64Array(1)

	get length(): number {
		return this.sizes.length
	}

	get total(): number {
		return this.prefix(this.length)
	}

	reset(sizes: readonly number[]): void {
		this.sizes = Float64Array.from(sizes, normalizeSize)
		this.tree = new Float64Array(this.sizes.length + 1)

		for (let index = 1; index <= this.sizes.length; index++) {
			this.tree[index] += this.sizes[index - 1]
			const parent = index + (index & -index)
			if (parent <= this.sizes.length) {
				this.tree[parent] += this.tree[index]
			}
		}

	}

	get(index: number): number {
		return this.sizes[index] ?? 0
	}

	set(index: number, size: number): number {
		if (index < 0 || index >= this.sizes.length) {
			return 0
		}

		const next = normalizeSize(size)
		const delta = next - this.sizes[index]
		if (delta === 0) {
			return 0
		}

		this.sizes[index] = next
		for (let node = index + 1; node < this.tree.length; node += node & -node) {
			this.tree[node] += delta
		}

		return delta
	}

	/** Sum of the first `count` row heights. */
	prefix(count: number): number {
		let node = Math.max(0, Math.min(this.sizes.length, Math.floor(count)))
		let sum = 0
		while (node > 0) {
			sum += this.tree[node]
			node -= node & -node
		}

		return sum
	}

	/** Index of the row containing `offset`; exact row boundaries select the
	 *  row that starts at that boundary. */
	indexAt(offset: number): number {
		if (this.sizes.length === 0) {
			return 0
		}

		const target = Math.max(0, Math.min(this.total, Number.isFinite(offset) ? offset : 0))
		let index = 0
		let sum = 0
		let bit = 1
		while (bit * 2 <= this.sizes.length) {
			bit *= 2
		}

		for (; bit > 0; bit = Math.floor(bit / 2)) {
			const next = index + bit
			if (next <= this.sizes.length && sum + this.tree[next] <= target) {
				index = next
				sum += this.tree[next]
			}
		}

		return Math.min(index, this.sizes.length - 1)
	}
}

export function virtualListRange(
	sizes: VirtualListSizeIndex,
	scrollOffset: number,
	viewportSize: number,
	overscanSize = viewportSize,
): VirtualListRange {
	if (sizes.length === 0) {
		return { start: 0, end: 0, top: 0, bottom: 0 }
	}

	const offset = Math.max(0, Number.isFinite(scrollOffset) ? scrollOffset : 0)
	const viewport = Math.max(0, Number.isFinite(viewportSize) ? viewportSize : 0)
	const overscan = Math.max(0, Number.isFinite(overscanSize) ? overscanSize : 0)
	const start = sizes.indexAt(Math.max(0, offset - overscan))
	const end = Math.min(
		sizes.length,
		Math.max(start + 1, sizes.indexAt(offset + viewport + overscan) + 1),
	)

	return {
		start,
		end,
		top: sizes.prefix(start),
		bottom: Math.max(0, sizes.total - sizes.prefix(end)),
	}
}

/** Renderer keys include the item type so changing a key's type remounts its
 *  row instead of carrying component state into an incompatible template. */
export function virtualListRowKey(key: VirtualListKey, type: VirtualListKey): string {
	return JSON.stringify([typeof key, key, typeof type, type])
}

function assertKey(value: unknown, name: string): asserts value is VirtualListKey {
	if (
		(typeof value !== 'string' && typeof value !== 'number') ||
		(typeof value === 'number' && !Number.isFinite(value))
	) {
		throw new Error(`VirtualList ${name} must return a finite number or string`)
	}
}

function normalizeSize(size: number): number {
	if (!Number.isFinite(size)) {
		return 0.01
	}

	return Math.max(0.01, size)
}
