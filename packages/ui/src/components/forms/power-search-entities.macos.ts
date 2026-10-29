import type { EntityListOperatorValue, PowerSearchEntity, SearchableItem } from '../../props'

/** Keep source row data for custom renderers; identity, not label, owns selection. */
export function entitySelection(items: readonly SearchableItem[]): SearchableItem[] {
	const seen = new Set<string>()
	return items.filter((item) => {
		if (seen.has(item.id)) return false
		seen.add(item.id)
		return true
	})
}

/** Stored filters contain no renderable nodes or source auxiliary data. */
export function entityValue(items: readonly SearchableItem[]): PowerSearchEntity[] {
	return entitySelection(items).map((item) => {
		const photo: unknown = Reflect.get(item, 'photo')
		return { id: item.id, label: item.label, ...(typeof photo === 'string' ? { photo } : {}) }
	})
}

export function splitEntityEntries(text: string, regex?: string, sort = false): string[] {
	const separator = new RegExp(regex ?? '[,\\r\\n]+', 'g')
	const parts: string[] = []
	let start = 0, match: RegExpExecArray | null
	// String.split inserts capturing groups as entries; separators never become picks.
	while ((match = separator.exec(text))) {
		if (!match[0].length) { separator.lastIndex++; continue }
		parts.push(text.slice(start, match.index))
		start = separator.lastIndex
	}
	parts.push(text.slice(start))
	const tokens = [...new Set(parts.map((part) => part.trim()).filter(Boolean))]
	return sort ? tokens.sort() : tokens
}

export interface EntityBatchResult { items?: SearchableItem[]; error?: string }

/** Resolve serially and return one atomic draft; never publish partial successes.
 * Exact IDs win, then unique case-sensitive labels. Fuzzy results are not picks. */
export async function resolveEntityEntries(
	text: string, config: EntityListOperatorValue, selected: readonly SearchableItem[], signal: AbortSignal,
): Promise<EntityBatchResult> {
	let tokens: string[]
	try { tokens = splitEntityEntries(text, config.tokenization?.regex, config.tokenization?.sort) }
	catch { return { error: 'The entry separator is invalid. Ask the app author to check this filter.' } }
	if (signal.aborted) return {}
	if (!tokens.length) return { error: 'Enter at least one item.' }
	const items = entitySelection(selected)
	for (const token of tokens) {
		if (signal.aborted) return {}
		let candidates = items
		// Reuse exact selected IDs; search labels to detect ambiguous remote matches.
		if (!items.some((item) => item.id === token) && config.searchSource) {
			const request = new AbortController()
			const abort = () => request.abort()
			signal.addEventListener('abort', abort, { once: true })
			try { candidates = entitySelection([...items, ...await config.searchSource.search(token, { signal: request.signal })]) }
			catch { return signal.aborted ? {} : { error: 'Could not look up these entries. Try again.' } }
			finally { signal.removeEventListener('abort', abort) }
		}
		if (signal.aborted) return {}
		const exactID = candidates.find((item) => item.id === token)
		const labels = candidates.filter((item) => item.label === token)
		if (!exactID && labels.length > 1) return { error: 'An entry matches several items. Select it from search instead.' }
		const match = exactID ?? labels[0]
		if (!match && !config.isArbitraryStringAllowed) return { error: 'An entry has no exact match. Select it from search instead.' }
		const item = match ?? { id: token, label: token }
		if (!items.some((current) => current.id === item.id)) items.push(item)
	}
	return { items }
}
