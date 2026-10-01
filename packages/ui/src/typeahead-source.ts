import type { CreateStaticSourceOptions, SearchableItem, SearchSource } from './props'

/** Create a SearchSource from a static item array — substring match on
 *  `label` plus optional `keywords`. For fuzzy/ranked/server-side matching
 *  implement `SearchSource` directly. */
export function createStaticSource<T extends SearchableItem>(
	items: T[],
	options?: CreateStaticSourceOptions<T>,
): SearchSource<T> {
	const getKeywords = options?.keywords
	return {
		search(query: string): T[] {
			const lower = query.toLowerCase().trim()
			if (lower === '') return items
			return items.filter((item) => {
				if (item.label.toLowerCase().includes(lower)) return true
				return getKeywords
					? getKeywords(item).some((kw) => kw.toLowerCase().includes(lower))
					: false
			})
		},
		bootstrap(): T[] {
			return items
		},
	}
}

/** User-perceived character count — one emoji/flag/accented grapheme counts
 *  once. `minQueryLength` is measured in these, not UTF-16 code units. */
export function characterCount(str: string): number {
	if (str === '') return 0
	const Segmenter = (Intl as any).Segmenter
	if (typeof Segmenter === 'function') {
		const segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
		let count = 0
		for (const _ of segmenter.segment(str)) count++
		return count
	}
	// Code-point fallback: keeps surrogate pairs whole on runtimes without
	// Intl.Segmenter (older JSC); joined emoji sequences may over-count.
	return [...str].length
}

/** An item's group heading, read from `auxiliaryData.group`. */
export function getItemGroup(item: SearchableItem): string | undefined {
	const aux = item.auxiliaryData as Record<string, unknown> | undefined
	return typeof aux?.group === 'string' ? aux.group : undefined
}

export interface TypeaheadItemGroup<T extends SearchableItem = SearchableItem> {
	heading: string | null
	items: T[]
}

/** Group results by `auxiliaryData.group`, preserving insertion order.
 *  Ungrouped items collect into a `heading: null` group; `ungroupedFirst`
 *  places it before the named groups. No groups → one `heading: null` group. */
export function groupTypeaheadItems<T extends SearchableItem>(
	items: T[],
	{ ungroupedFirst = false }: { ungroupedFirst?: boolean } = {},
): TypeaheadItemGroup<T>[] {
	if (!items.some((item) => getItemGroup(item) != null)) {
		return [{ heading: null, items }]
	}

	const order: string[] = []
	const groups = new Map<string, T[]>()
	const ungrouped: T[] = []
	for (const item of items) {
		const group = getItemGroup(item)
		if (group != null) {
			if (!groups.has(group)) {
				order.push(group)
				groups.set(group, [])
			}
			groups.get(group)?.push(item)
		} else {
			ungrouped.push(item)
		}
	}

	const named = order.map((heading) => ({ heading, items: groups.get(heading) ?? [] }))
	const tail = ungrouped.length > 0 ? [{ heading: null, items: ungrouped }] : []
	return ungroupedFirst ? [...tail, ...named] : [...named, ...tail]
}
