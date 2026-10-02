import type { CommandPaletteItem, CommandPaletteProps } from './props'
import { createStore } from './store'
import { groupTypeaheadItems } from './typeahead-source'

/** Exact/prefix/substring matches outrank subsequences; ties keep input order. */
function score(query: string, text: string): number {
	const lower = text.toLowerCase()
	if (lower === query) {
		return 10000
	}

	if (lower.startsWith(query)) {
		return 8000 - lower.length
	}

	const at = lower.indexOf(query)
	if (at >= 0) {
		return 6000 - at - lower.length
	}

	let previous = -1
	let gaps = 0
	for (const character of query) {
		const next = lower.indexOf(character, previous + 1)
		if (next < 0) {
			return -Infinity
		}

		gaps += next - previous - 1
		previous = next
	}

	return 4000 - gaps - lower.length
}

export function staticCommands(
	props: Pick<CommandPaletteProps, 'items' | 'searchMode'>,
	query: string,
): CommandPaletteItem[] {
	const items = (props.items ?? []).map((item) => ({
		...item,
		id: item.key,
		label: item.label ?? item.key,
		auxiliaryData: { group: item.group },
	}))

	const lower = query.toLowerCase().trim()
	if (!lower) {
		return items
	}

	const ranked = items
		.map((item, index) => {
			const terms = [item.label, ...(item.keywords ?? [])]
			const rank =
				props.searchMode === 'fuzzy'
					? Math.max(...terms.map((term) => score(lower, term)))
					: terms.some((term) => term.toLowerCase().includes(lower))
						? 0
						: -Infinity

			return { item, index, rank }
		})
		.filter((entry) => Number.isFinite(entry.rank))

	if (props.searchMode === 'fuzzy') {
		ranked.sort((a, b) => b.rank - a.rank || a.index - b.index)
	}

	return ranked.map((entry) => entry.item)
}

export interface CommandPaletteState<T extends CommandPaletteItem> {
	open: boolean
	query: string
	results: T[]
	highlighted: string | null
	selected: string
	status: 'idle' | 'loading' | 'ready' | 'error'
}

/** Hook-free search/interaction owner. Every rendered root subscribes to store. */
export function createCommandPaletteController<T extends CommandPaletteItem>(
	read: () => CommandPaletteProps<T>,
) {
	const store = createStore<CommandPaletteState<T>>({
		open: false,
		query: '',
		results: [],
		highlighted: null,
		selected: '',
		status: 'idle',
	})

	let currentProps = read()
	let generation = 0
	let externalOpen = false
	let source = read().searchSource
	let staticItems = read().items
	let mode = read().searchMode
	let disposed = false

	const patch = (next: Partial<CommandPaletteState<T>>) => store.set({ ...store.get(), ...next })
	const invalidate = () => {
		generation++
		// Cancellation is advisory; even a throwing cancel cannot bypass invalidation.
		try {
			source?.cancel?.()
		} catch {
			/* The next search/close still proceeds. */
		}
	}

	const search = (query: string) => {
		if (disposed || !store.get().open) {
			return
		}

		invalidate()
		const version = generation
		patch({ query, results: [], highlighted: null, status: 'loading' })
		const commit = (items: T[]) => {
			if (disposed || version !== generation || !store.get().open) {
				return
			}

			const results = groupTypeaheadItems(items).flatMap((group) => group.items)
			const selected = store.get().selected
			patch({
				results,
				status: 'ready',
				highlighted: results.find((item) => item.id === selected && !item.disabled)?.id ?? null,
			})
		}

		const fail = () => {
			if (!disposed && version === generation && store.get().open) {
				patch({ results: [], highlighted: null, status: 'error' })
			}
		}

		try {
			const result = source
				? query.trim() === ''
					? source.bootstrap()
					: source.search(query)
				: (staticCommands(currentProps, query) as T[])

			if (Array.isArray(result)) {
				commit(result)
			} else {
				Promise.resolve(result).then(commit).catch(fail)
			}
		} catch {
			fail()
		}
	}

	const close = () => {
		if (!store.get().open) {
			return
		}

		invalidate()
		patch({ open: false, query: '', results: [], highlighted: null, status: 'idle' })
		currentProps.onOpenChange?.(false)
	}

	const select = (id: string) => {
		const state = store.get()
		const item = state.results.find((entry) => entry.id === id)
		if (!state.open || state.status !== 'ready' || !item || item.disabled) {
			return
		}

		patch({ selected: currentProps.value ?? id })
		currentProps.onValueChange?.(id)
		close()
		item.onSelect?.()
	}

	const highlight = (id: string | null) => {
		if (id === null || store.get().results.some((item) => item.id === id && !item.disabled)) {
			patch({ highlighted: id })
		}
	}

	const keyDown = (event: {
		key: string
		isComposing?: boolean
		keyCode?: number
		defaultPrevented?: boolean
		preventDefault(): void
	}) => {
		if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || !store.get().open) {
			return
		}

		if (event.key === 'Escape') {
			event.preventDefault()
			close()
			return
		}

		const state = store.get()
		const enabled = state.results.filter((item) => !item.disabled)
		if (event.key === 'Enter') {
			event.preventDefault()
			if (state.highlighted) {
				select(state.highlighted)
			}

			return
		}

		if (!['ArrowDown', 'ArrowUp', 'PageUp', 'PageDown'].includes(event.key)) {
			return
		}

		event.preventDefault()
		if (!enabled.length) {
			return
		}

		const current = enabled.findIndex((item) => item.id === state.highlighted)
		const next =
			event.key === 'PageUp'
				? 0
				: event.key === 'PageDown'
					? enabled.length - 1
					: current < 0
						? 0
						: Math.max(
								0,
								Math.min(enabled.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)),
							)

		highlight(enabled[next].id)
	}

	return {
		store,
		search,
		close,
		select,
		highlight,
		keyDown,
		configure(props = read()) {
			currentProps = props
			const changed =
				source !== props.searchSource || staticItems !== props.items || mode !== props.searchMode

			const opened = !externalOpen && Boolean(props.open)
			if (changed) {
				invalidate()
			}

			source = props.searchSource
			staticItems = props.items
			mode = props.searchMode
			externalOpen = Boolean(props.open)
			if (props.value !== undefined && props.value !== store.get().selected) {
				patch({ selected: props.value })
			}

			if (!externalOpen) {
				invalidate()
				patch({ open: false, query: '', results: [], highlighted: null, status: 'idle' })
			} else if (opened) {
				patch({ open: true })
				search('')
			} else if (changed && store.get().open) {
				search(store.get().query)
			}
		},
		dispose() {
			disposed = true
			invalidate()
		},
	}
}
