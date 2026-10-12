import type { Key, Selection } from './list-data'

/** Pure GridList press → selection mapping, React Aria semantics:
 * 'toggle' behavior toggles membership and extends the range from the
 * anchor on Shift+press; 'replace' selects only the pressed key.
 * `disallowEmptySelection` keeps the last selected key. `all`
 * materializes over the item keys on first mutation. */

export function normalizeSelection(input: 'all' | Iterable<Key> | undefined): Selection {
	if (input === 'all') {
		return 'all'
	}

	return new Set(input ?? [])
}

export function isGridListKeySelected(selection: Selection, key: Key): boolean {
	return selection === 'all' ? true : selection.has(key)
}

export interface GridListPressArgs {
	selection: Selection
	key: Key
	index: number
	anchorIndex: number | null
	keys: Key[]
	selectionMode: 'single' | 'multiple'
	selectionBehavior: 'toggle' | 'replace'
	disallowEmptySelection?: boolean
	shiftKey?: boolean
}

export interface GridListPressResult {
	selection: Selection
	anchorIndex: number
}

export function gridListPress(args: GridListPressArgs): GridListPressResult {
	const selected = args.selection === 'all' ? new Set(args.keys) : new Set(args.selection)
	const { key, index, shiftKey } = args

	if (args.selectionMode === 'multiple' && shiftKey && args.anchorIndex != null) {
		const lo = Math.min(args.anchorIndex, index)
		const hi = Math.max(args.anchorIndex, index)
		const range = args.keys.slice(lo, hi + 1)
		// 'toggle' unions the range; 'replace' takes it as the whole selection.
		const next =
			args.selectionBehavior === 'replace' ? new Set(range) : new Set([...selected, ...range])

		return { selection: next, anchorIndex: args.anchorIndex }
	}

	let next: Set<Key>
	if (args.selectionMode === 'single') {
		next = selected.has(key) ? new Set() : new Set([key])
	} else if (args.selectionBehavior === 'replace') {
		next = new Set([key])
	} else {
		next = new Set(selected)
		if (next.has(key)) {
			next.delete(key)
		} else {
			next.add(key)
		}
	}

	if (!next.size && args.disallowEmptySelection) {
		next = selected
	}

	return { selection: next, anchorIndex: index }
}
