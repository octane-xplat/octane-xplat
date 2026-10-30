/**
 * Immutable tree-data store mirroring React Aria's useTreeData semantics:
 * raw values are processed into nodes ({key, parentKey, value, children}),
 * mutators produce fresh trees, and removal prunes selection — including
 * descendants of removed subtrees.
 */
import { defaultItemKey, normalizeSelection, type Key, type Selection } from './list-data'
import type { ReadableStore } from '../props'

export type { Key, Selection }

/**
 * One node in a `TreeData` store — wraps the item `value` with `key`, `parentKey`, and resolved `children`.
 */
export interface TreeNode<T> {
	/** Item identity — resolved through `getKey`. */
	readonly key: Key
	/** Parent node key; null at the root level. */
	readonly parentKey: Key | null
	/** The original item. */
	readonly value: T
	/** Resolved child nodes — empty for leaves. */
	readonly children: readonly TreeNode<T>[]
}

/**
 * Options for `useTreeData`/`createTreeData` — `initialItems`, `initialSelectedKeys`, `getKey`, `getChildren`. `initial*` values are read once at store creation.
 */
export interface TreeDataOptions<T> {
	/** All `initial*` options are read once, when the store is created —
	 *  `useTreeData` builds the store on first render and ignores later
	 *  option values. */
	initialItems?: Iterable<T>
	/** Initial selection — a Selection, key iterable, or 'all'. */
	initialSelectedKeys?: Selection | Iterable<Key>
	/** Item identity extractor — defaults to `defaultItemKey` (`id`/`key` fields). */
	getKey?: (item: T) => Key
	/** Child extractor — defaults to the item's `children` field. */
	getChildren?: (item: T) => Iterable<T>
}

/**
 * Immutable snapshot of a `TreeData` — nodes and expansion at read time.
 */
export interface TreeSnapshot<T> {
	/** Root-level nodes at commit time. */
	readonly items: readonly TreeNode<T>[]
	/** Selection — a key Set or 'all'. */
	readonly selectedKeys: Selection
}

/**
 * Reactive tree collection store backing `TreeList` — tree `items` plus `selectedKeys`, with insert/remove/move/update mutators and keyed `getItem`/`getChildren`. Mirrors React Aria's useTreeData; the reactive read is `useTreeData`/`useStore` — property reads on the store itself do not subscribe.
 */
export interface TreeData<T> extends ReadableStore<TreeSnapshot<T>> {
	/** Snapshot reads — they never subscribe; `useTreeData`/`useStore` is
	 *  the reactive read. */
	readonly items: readonly TreeNode<T>[]
	/** Selection — a snapshot read, not a subscription. */
	readonly selectedKeys: Selection
	/** Replaces the selection — a Selection, key iterable, or 'all'. */
	setSelectedKeys(keys: Selection | Iterable<Key>): void
	/** Node by key; undefined when absent. */
	getItem(key: Key): TreeNode<T> | undefined
	/** Children of `key`; root level when null. */
	getChildren(key: Key | null): readonly TreeNode<T>[]
	/** Inserts values under `parentKey` at `index`; null targets the root. */
	insert(parentKey: Key | null, index: number, ...values: T[]): void
	/** Inserts values as siblings before `key`; no-op when absent. */
	insertBefore(key: Key, ...values: T[]): void
	/** Inserts values as siblings after `key`; no-op when absent. */
	insertAfter(key: Key, ...values: T[]): void
	/** Appends values at the end of `parentKey`'s children; null targets the root. */
	append(parentKey: Key | null, ...values: T[]): void
	/** Prepends values at the start of `parentKey`'s children; null targets the root. */
	prepend(parentKey: Key | null, ...values: T[]): void
	/** Removes nodes by key, with their subtrees; removed keys leave the selection. */
	remove(...keys: Key[]): void
	/** Removes every selected node ('all' empties the tree). */
	removeSelectedItems(): void
	/** Move a subtree atomically. Self, descendant, or missing parents are no-ops. */
	move(key: Key, toParentKey: Key | null, toIndex: number): void
	/** Replaces the value at `key`, keeping its children; no-op when absent. */
	update(key: Key, value: T): void
}

function defaultGetChildren<T>(item: T): Iterable<T> {
	return ((item as { children?: Iterable<T> }).children ?? []) as Iterable<T>
}

/** Creates an immutable `TreeData` store — mutators commit fresh snapshots and notify subscribers. */
export function createTreeData<T>(options: TreeDataOptions<T> = {}): TreeData<T> {
	const getKey = options.getKey ?? defaultItemKey
	const getChildren = options.getChildren ?? defaultGetChildren

	const build = (value: T, parentKey: Key | null): TreeNode<T> => {
		const key = getKey(value)
		return {
			key,
			parentKey,
			value,
			children: [...getChildren(value)].map((child) => build(child, key)),
		}
	}

	let snapshot: TreeSnapshot<T> = {
		items: [...(options.initialItems ?? [])].map((value) => build(value, null)),
		selectedKeys: normalizeSelection(options.initialSelectedKeys),
	}

	const listeners = new Set<() => void>()
	const commit = (next: TreeSnapshot<T>) => {
		snapshot = next
		for (const listener of [...listeners]) {
			listener()
		}
	}

	const locate = (
		nodes: readonly TreeNode<T>[],
		key: Key,
	): { node: TreeNode<T>; siblings: readonly TreeNode<T>[]; index: number } | null => {
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].key === key) {
				return { node: nodes[i], siblings: nodes, index: i }
			}

			const found = locate(nodes[i].children, key)
			if (found) {
				return found
			}
		}

		return null
	}

	const find = (key: Key) => locate(snapshot.items, key)

	const childrenOf = (key: Key | null): readonly TreeNode<T>[] =>
		key === null ? snapshot.items : (find(key)?.node.children ?? [])

	const collectKeys = (node: TreeNode<T>, into: Set<Key>) => {
		into.add(node.key)
		for (const child of node.children) {
			collectKeys(child, into)
		}
	}

	const pruneSelection = (removed: ReadonlySet<Key>): Selection => {
		if (snapshot.selectedKeys === 'all') {
			return 'all'
		}

		const next = new Set(snapshot.selectedKeys)
		for (const key of removed) {
			next.delete(key)
		}

		return next
	}

	// Rebuild the tree applying `edit` to the matching sibling list. Returns
	// null when the target is absent so callers can no-op like React Aria.
	const rebuild = (
		nodes: readonly TreeNode<T>[],
		match: (siblings: readonly TreeNode<T>[]) => TreeNode<T>[] | null,
	): TreeNode<T>[] | null => {
		const replaced = match(nodes)
		if (replaced) {
			return replaced
		}

		let changed = false
		const next = nodes.map((node) => {
			const children = rebuild(node.children, match)
			if (children) {
				changed = true
				return { ...node, children }
			}

			return node
		})

		return changed ? next : null
	}

	const editSiblingsOf = (
		key: Key,
		edit: (siblings: readonly TreeNode<T>[], index: number) => TreeNode<T>[],
	) => {
		const next = rebuild(snapshot.items, (siblings) => {
			const index = siblings.findIndex((node) => node.key === key)
			return index < 0 ? null : edit(siblings, index)
		})

		if (next) {
			commit({ ...snapshot, items: next })
		}
	}

	const editChildrenOf = (
		parentKey: Key | null,
		edit: (children: readonly TreeNode<T>[]) => TreeNode<T>[],
	) => {
		if (parentKey === null) {
			commit({ ...snapshot, items: edit(snapshot.items) })
			return
		}

		editSiblingsOf(parentKey, (siblings, index) => {
			const next = [...siblings]
			next[index] = { ...siblings[index], children: edit(siblings[index].children) }
			return next
		})
	}

	const remove = (keys: Iterable<Key>) => {
		const removed = new Set(keys)
		const detached = new Set<Key>()
		const strip = (nodes: readonly TreeNode<T>[]): TreeNode<T>[] =>
			nodes
				.filter((node) => {
					if (removed.has(node.key)) {
						collectKeys(node, detached)
						return false
					}

					return true
				})
				.map((node) => ({ ...node, children: strip(node.children) }))

		const items = strip(snapshot.items)
		commit({ ...snapshot, items, selectedKeys: pruneSelection(detached) })
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
			return snapshot.items
		},
		get selectedKeys() {
			return snapshot.selectedKeys
		},
		setSelectedKeys(keys) {
			commit({ ...snapshot, selectedKeys: normalizeSelection(keys) })
		},
		getItem: (key) => find(key)?.node,
		getChildren: childrenOf,
		insert(parentKey, index, ...values) {
			const nodes = values.map((value) => build(value, parentKey))
			editChildrenOf(parentKey, (children) => {
				const next = [...children]
				next.splice(index, 0, ...nodes)
				return next
			})
		},
		insertBefore(key, ...values) {
			const found = find(key)
			if (!found) {
				return
			}

			const nodes = values.map((value) => build(value, found.node.parentKey))
			editSiblingsOf(key, (siblings, index) => {
				const next = [...siblings]
				next.splice(index, 0, ...nodes)
				return next
			})
		},
		insertAfter(key, ...values) {
			const found = find(key)
			if (!found) {
				return
			}

			const nodes = values.map((value) => build(value, found.node.parentKey))
			editSiblingsOf(key, (siblings, index) => {
				const next = [...siblings]
				next.splice(index + 1, 0, ...nodes)
				return next
			})
		},
		append(parentKey, ...values) {
			const nodes = values.map((value) => build(value, parentKey))
			editChildrenOf(parentKey, (children) => [...children, ...nodes])
		},
		prepend(parentKey, ...values) {
			const nodes = values.map((value) => build(value, parentKey))
			editChildrenOf(parentKey, (children) => [...nodes, ...children])
		},
		remove: (...keys) => remove(keys),
		removeSelectedItems() {
			if (snapshot.selectedKeys === 'all') {
				commit({ ...snapshot, items: [] })
				return
			}

			remove(snapshot.selectedKeys)
		},
		move(key, toParentKey, toIndex) {
			const found = find(key)
			if (
				!found ||
				(toParentKey !== null && (!find(toParentKey) || locate([found.node], toParentKey)))
			) {
				return
			}

			// Validate first, then detach and insert in one published snapshot.
			const detached = rebuild(snapshot.items, (siblings) => {
				const index = siblings.findIndex((node) => node.key === key)
				if (index < 0) {
					return null
				}
				return siblings.filter((_, i) => i !== index)
			})!
			const moved = { ...found.node, parentKey: toParentKey }
			const insert = (children: readonly TreeNode<T>[]) => {
				const next = [...children]
				next.splice(toIndex, 0, moved)
				return next
			}
			const items =
				toParentKey === null
					? insert(detached)
					: rebuild(detached, (siblings) => {
							const index = siblings.findIndex((node) => node.key === toParentKey)
							if (index < 0) {
								return null
							}
							const next = [...siblings]
							next[index] = { ...siblings[index], children: insert(siblings[index].children) }
							return next
						})!
			commit({ ...snapshot, items })
		},
		update(key, value) {
			const found = find(key)
			if (!found) {
				return
			}

			const node = build(value, found.node.parentKey)
			editSiblingsOf(key, (siblings, index) => {
				const next = [...siblings]
				next[index] = node
				return next
			})
		},
	}
}
