// Grouped-rows flattening — port of upstream
// plugins/groupedRows/useTableGroupedRows.tsx (Astryx 0.6.4, MIT). Pure data
// logic shared by the platform leaves: synthetic Symbol-marked Proxy header
// rows, group ordering, and the `__group_<key>` idKey resolver.

// A synthetic group-header row injected into the flattened data. Real rows
// never carry this marker.
export const GROUP_HEADER: unique symbol = Symbol('tableGroupHeader')

export interface TableGroupHeader {
	[GROUP_HEADER]: true
	groupKey: string
	count: number
}

export function isGroupHeader(item: unknown): item is TableGroupHeader {
	return (
		typeof item === 'object' &&
		item !== null &&
		(item as Record<symbol, unknown>)[GROUP_HEADER] === true
	)
}

// Proxy handler: any field access beyond the marker fields resolves to `''`,
// which keeps anything that reads a header's data — the sortable and
// filtering plugins, a consumer's own row handler — off `undefined`. Cell
// renderers are handled at render time via `isContentSuppressed`; the Proxy
// never protected them, because `''` fails a lookup exactly as `undefined`.
const HEADER_PROXY_HANDLER: ProxyHandler<Record<string | symbol, unknown>> = {
	get(t: Record<string | symbol, unknown>, prop: string | symbol): unknown {
		if (prop === GROUP_HEADER || prop === 'groupKey' || prop === 'count') {
			return t[prop]
		}
		return prop in t ? t[prop] : ''
	},
}

/** Build a synthetic header row wrapped in a Proxy so field access resolves
 *  to `''` instead of `undefined`. */
export function makeGroupHeader<T extends Record<string, unknown>>(
	groupKey: string,
	count: number,
): T {
	const target: Record<string | symbol, unknown> = {
		[GROUP_HEADER]: true,
		groupKey,
		count,
	}
	return new Proxy(target, HEADER_PROXY_HANDLER) as unknown as T
}

/**
 * Flatten `data` into `[header, ...visibleRows]` per group, preserving
 * first-seen group order (or `groupOrder` first, then first-seen for the
 * rest). Collapsed groups contribute only their header row.
 */
export function flattenGroups<T extends Record<string, unknown>>(
	data: T[],
	groupBy: (item: T) => string,
	collapsedGroups: Set<string>,
	groupOrder?: string[],
): T[] {
	if (data.length === 0) {
		return []
	}

	// Group preserving first-seen order.
	const groups = new Map<string, T[]>()
	for (const item of data) {
		const key = groupBy(item)
		const bucket = groups.get(key)
		if (bucket) {
			bucket.push(item)
		} else {
			groups.set(key, [item])
		}
	}

	// Determine iteration order.
	let keys = [...groups.keys()]
	if (groupOrder && groupOrder.length > 0) {
		const ordered = groupOrder.filter((k) => groups.has(k))
		const rest = keys.filter((k) => !groupOrder.includes(k))
		keys = [...ordered, ...rest]
	}

	const out: T[] = []
	for (const key of keys) {
		const rows = groups.get(key) ?? []
		out.push(makeGroupHeader<T>(key, rows.length))
		if (!collapsedGroups.has(key)) {
			out.push(...rows)
		}
	}
	return out
}

/**
 * Build the `idKey` resolver: headers key as `__group_<key>`; real rows use
 * `getRowKey` when provided, else their position in the flattened array
 * (positional map built once so key lookup stays O(1)).
 */
export function makeGroupedIdKey<T extends Record<string, unknown>>(
	flattened: T[],
	getRowKey?: (item: T) => string,
): (item: T) => string {
	const positionByItem = getRowKey
		? null
		: new Map<T, number>(flattened.map((item, i) => [item, i]))
	return (item: T): string => {
		if (isGroupHeader(item)) {
			return `__group_${item.groupKey}`
		}
		if (getRowKey) {
			return getRowKey(item)
		}
		return String(positionByItem?.get(item) ?? -1)
	}
}
