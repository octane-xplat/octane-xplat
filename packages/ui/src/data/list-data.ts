/**
 * Immutable list-data store mirroring React Aria's useListData semantics:
 * every mutator produces fresh state, subscribers re-render, and removal
 * prunes selection. Pure module — useListData (use-list-data.tsx) subscribes
 * a renderer to a store created once per component.
 */
import type { Key, ReadableStore, Selection } from '../props'

export type { Key, Selection }

/**
 * Options for `useListData`/`createListData` — `initialItems`, `initialSelectedKeys`, `initialFilterText`, `getKey`, `filter`. `initial*` values are read once at store creation.
 */
export interface ListDataOptions<T> {
	/** All `initial*` options are read once, when the store is created —
	 *  `useListData` builds the store on first render and ignores later
	 *  option values. */
	initialItems?: Iterable<T>
	/** Initial selection — a Selection, key iterable, or 'all'. */
	initialSelectedKeys?: Selection | Iterable<Key>
	/** Initial query applied through `filter`. */
	initialFilterText?: string
	/** Item identity extractor — defaults to `defaultItemKey` (`id`/`key` fields). */
	getKey?: (item: T) => Key
	/** Predicate applied to items against `filterText`. */
	filter?: (item: T, filterText: string) => boolean
}

/**
 * Immutable snapshot of a `ListData` — filtered `items`, `filterText`, `selectedKeys`.
 */
export interface ListSnapshot<T> {
	/** Unfiltered item array at commit time. */
	readonly items: readonly T[]
	/** Query text applied by `filter` on read. */
	readonly filterText: string
	/** Selection — a key Set or 'all'. */
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
	/** Query text — a snapshot read, not a subscription. */
	readonly filterText: string
	/** Selection — a snapshot read, not a subscription. */
	readonly selectedKeys: Selection
	/** Sets the query text; items re-filter on the next read. */
	setFilterText(filterText: string): void
	/** Replaces the selection — a Selection, key iterable, or 'all'. */
	setSelectedKeys(keys: Selection | Iterable<Key>): void
	/** Item by key; undefined when absent. */
	getItem(key: Key): T | undefined
	/** Inserts values at `index`. */
	insert(index: number, ...values: T[]): void
	/** Inserts values before `key`; no-op when the key is absent. */
	insertBefore(key: Key, ...values: T[]): void
	/** Inserts values after `key`; no-op when the key is absent. */
	insertAfter(key: Key, ...values: T[]): void
	/** Appends values at the end. */
	append(...values: T[]): void
	/** Prepends values at the start. */
	prepend(...values: T[]): void
	/** Removes items by key; removed keys leave the selection. */
	remove(...keys: Key[]): void
	/** Removes every selected item ('all' empties the list). */
	removeSelectedItems(): void
	/** Moves `key` to index `toIndex`. */
	move(key: Key, toIndex: number): void
	/** Moves `keys` before `key`; preserves relative order. */
	moveBefore(key: Key, keys: Iterable<Key>): void
	/** Moves `keys` after `key`; preserves relative order. */
	moveAfter(key: Key, keys: Iterable<Key>): void
	/** Replaces the item at `key`; no-op when absent. */
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

/** Coerces 'all' | iterable | undefined into a Selection — undefined becomes an empty Set. */
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

/** Creates an immutable `ListData` store — every mutator commits a fresh snapshot and notifies subscribers. */
export function createListData<T>(options: ListDataOptions<T> = {}): ListData<T> {
	return createListDataController(options).list
}

/** @internal Atomic collection replacement for the async-list owner. */
export function createListDataController<T>(options: ListDataOptions<T> = {}): {
	/** The list store. */
	list: ListData<T>
	/** Atomic collection replacement — preserves selection for keys still
	 *  present unless `selectedKeys` overrides it. */
	replace(items: readonly T[], selectedKeys?: Selection | Iterable<Key>): void
} {
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

	const list: ListData<T> = {
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
	return {
		list,
		replace(items: readonly T[], selectedKeys?: Selection | Iterable<Key>): void {
			const present = new Set(items.map(getKey))
			const removed = new Set(snapshot.items.map(getKey).filter((key) => !present.has(key)))
			commit({
				...snapshot,
				items: [...items],
				selectedKeys:
					selectedKeys === undefined
						? pruneSelection(snapshot.selectedKeys, removed)
						: normalizeSelection(selectedKeys),
			})
		},
	}
}
