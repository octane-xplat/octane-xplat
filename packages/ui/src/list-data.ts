/**
 * Immutable list-data store mirroring React Aria's useListData semantics:
 * every mutator produces fresh state, subscribers re-render, and removal
 * prunes selection. Pure module — useListData (use-list-data.tsx) subscribes
 * a renderer to a store created once per component.
 */
import type { Key, ReadableStore, Selection } from './props'

export type { Key, Selection }

/**
 * Options for `useListData`/`createListData` — `initialItems`, `initialSelectedKeys`, `initialFilterText`, `getKey`, `filter`. `initial*` values are read once at store creation.
 */
export interface ListDataOptions<T> {
	/** All `initial*` options are read once, when the store is created —
	 *  `useListData` builds the store on first render and ignores later
	 *  option values. */
	initialItems?: Iterable<T>
	initialSelectedKeys?: Selection | Iterable<Key>
	initialFilterText?: string
	getKey?: (item: T) => Key
	filter?: (item: T, filterText: string) => boolean
}

/**
 * Immutable snapshot of a `ListData` — filtered `items`, `filterText`, `selectedKeys`.
 */
export interface ListSnapshot<T> {
	readonly items: readonly T[]
	readonly filterText: string
	readonly selectedKeys: Selection
}

/**
 * Reactive list collection store — `items`, `filterText`, and `selectedKeys` with the React Aria `useListData` mutator set (insert/remove/move/update). Reads go through `useListData`/`useStore`; direct property reads are non-reactive snapshots.
 */
export interface ListData<T> extends ReadableStore<ListSnapshot<T>> {
	/** Items after applying `filter` with the current `filterText` — a
	 *  snapshot read, not a subscription; `useListData`/`useStore` is the
	 *  reactive read. */
	readonly items: readonly T[]
	readonly filterText: string
	readonly selectedKeys: Selection
	setFilterText(filterText: string): void
	setSelectedKeys(keys: Selection | Iterable<Key>): void
	getItem(key: Key): T | undefined
	insert(index: number, ...values: T[]): void
	insertBefore(key: Key, ...values: T[]): void
	insertAfter(key: Key, ...values: T[]): void
	append(...values: T[]): void
	prepend(...values: T[]): void
	remove(...keys: Key[]): void
	removeSelectedItems(): void
	move(key: Key, toIndex: number): void
	moveBefore(key: Key, keys: Iterable<Key>): void
	moveAfter(key: Key, keys: Iterable<Key>): void
	update(key: Key, value: T): void
}

/** Shared default item identity — reads the item's `id` or `key` property.
 *  The collection components and data stores use it as the `keyExtractor`/
 *  `getKey` default; an item without either field fails loudly instead of
 *  falling back to a positional key. */
export function defaultItemKey<T>(item: T): Key {
	const key = (item as { id?: Key }).id ?? (item as { key?: Key }).key
	if (key == null) {
		throw new Error('item has no `id` or `key` property — pass getKey or keyExtractor')
	}

	return key
}

export function normalizeSelection(keys: 'all' | Iterable<Key> | undefined): Selection {
	if (keys === 'all') {
		return 'all'
	}

	return new Set(keys ?? [])
}

function pruneSelection(selection: Selection, removed: ReadonlySet<Key>): Selection {
	if (selection === 'all') {
		return selection
	}

	const next = new Set(selection)
	for (const key of removed) {
		next.delete(key)
	}

	return next
}

export function createListData<T>(options: ListDataOptions<T> = {}): ListData<T> {
	const getKey = options.getKey ?? defaultItemKey
	let snapshot: ListSnapshot<T> = {
		items: [...(options.initialItems ?? [])],
		filterText: options.initialFilterText ?? '',
		selectedKeys: normalizeSelection(options.initialSelectedKeys),
	}

	const listeners = new Set<() => void>()
	const commit = (next: ListSnapshot<T>) => {
		snapshot = next
		for (const listener of [...listeners]) {
			listener()
		}
	}

	const indexOf = (key: Key) => snapshot.items.findIndex((item) => getKey(item) === key)

	const remove = (keys: Iterable<Key>) => {
		const removed = new Set(keys)
		const items = snapshot.items.filter((item) => !removed.has(getKey(item)))
		if (items.length === snapshot.items.length) {
			return
		}

		commit({
			...snapshot,
			items,
			selectedKeys: pruneSelection(snapshot.selectedKeys, removed),
		})
	}

	const insertAt = (index: number, values: T[]) => {
		const items = [...snapshot.items]
		items.splice(index, 0, ...values)
		commit({ ...snapshot, items })
	}

	const moveKeys = (keys: Iterable<Key>, targetIndex: (remaining: T[]) => number) => {
		const moving = new Set(keys)
		if (!moving.size) {
			return
		}

		const picked = snapshot.items.filter((item) => moving.has(getKey(item)))
		const remaining = snapshot.items.filter((item) => !moving.has(getKey(item)))
		remaining.splice(targetIndex(remaining), 0, ...picked)
		commit({ ...snapshot, items: remaining })
	}

	return {
		getSnapshot: () => snapshot,
		subscribe(notify) {
			listeners.add(notify)
			return () => {
				listeners.delete(notify)
			}
		},
		get items() {
			return options.filter
				? snapshot.items.filter((item) => options.filter!(item, snapshot.filterText))
				: snapshot.items
		},
		get filterText() {
			return snapshot.filterText
		},
		get selectedKeys() {
			return snapshot.selectedKeys
		},
		setFilterText(filterText) {
			commit({ ...snapshot, filterText })
		},
		setSelectedKeys(keys) {
			commit({ ...snapshot, selectedKeys: normalizeSelection(keys) })
		},
		getItem: (key) => snapshot.items.find((item) => getKey(item) === key),
		insert: (index, ...values) => insertAt(index, values),
		insertBefore(key, ...values) {
			const index = indexOf(key)
			if (index < 0) {
				return
			}

			insertAt(index, values)
		},
		insertAfter(key, ...values) {
			const index = indexOf(key)
			if (index < 0) {
				return
			}

			insertAt(index + 1, values)
		},
		append: (...values) => insertAt(snapshot.items.length, values),
		prepend: (...values) => insertAt(0, values),
		remove: (...keys) => remove(keys),
		removeSelectedItems() {
			if (snapshot.selectedKeys === 'all') {
				commit({ ...snapshot, items: [] })
				return
			}

			remove(snapshot.selectedKeys)
		},
		move(key, toIndex) {
			moveKeys([key], () => toIndex)
		},
		moveBefore(key, keys) {
			const target = snapshot.items.find((item) => getKey(item) === key)
			if (target === undefined) {
				return
			}

			moveKeys(keys, (remaining) => remaining.indexOf(target))
		},
		moveAfter(key, keys) {
			const target = snapshot.items.find((item) => getKey(item) === key)
			if (target === undefined) {
				return
			}

			moveKeys(keys, (remaining) => remaining.indexOf(target) + 1)
		},
		update(key, value) {
			const index = indexOf(key)
			if (index < 0) {
				return
			}

			const items = [...snapshot.items]
			items[index] = value
			commit({ ...snapshot, items })
		},
	}
}
