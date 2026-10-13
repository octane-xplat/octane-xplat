/**
 * Immutable tree-data store mirroring React Aria's useTreeData semantics:
 * raw values are processed into nodes ({key, parentKey, value, children}),
 * mutators produce fresh trees, and removal prunes selection — including
 * descendants of removed subtrees.
 */
import { normalizeSelection, type Key, type Selection } from './list-data'
import type { ReadableStore } from './props'

export type { Key, Selection }

export interface TreeNode<T> {
	key: Key
	parentKey: Key | null
	value: T
	children: TreeNode<T>[]
}

export interface TreeDataOptions<T> {
	initialItems?: Iterable<T>
	initialSelectedKeys?: Selection | Iterable<Key>
	getKey?: (item: T) => Key
	getChildren?: (item: T) => Iterable<T>
}

export interface TreeSnapshot<T> {
	items: TreeNode<T>[]
	selectedKeys: Selection
}

export interface TreeData<T> extends ReadableStore<TreeSnapshot<T>> {
	readonly items: TreeNode<T>[]
	readonly selectedKeys: Selection
	setSelectedKeys(keys: Selection | Iterable<Key>): void
	getItem(key: Key): TreeNode<T> | undefined
	getChildren(key: Key | null): TreeNode<T>[]
	insert(parentKey: Key | null, index: number, ...values: T[]): void
	insertBefore(key: Key, ...values: T[]): void
	insertAfter(key: Key, ...values: T[]): void
	append(parentKey: Key | null, ...values: T[]): void
	prepend(parentKey: Key | null, ...values: T[]): void
	remove(...keys: Key[]): void
	removeSelectedItems(): void
	move(key: Key, toParentKey: Key | null, toIndex: number): void
	update(key: Key, value: T): void
}

function defaultGetKey<T>(item: T): Key {
	const key = (item as { id?: Key }).id ?? (item as { key?: Key }).key
	if (key == null) {
		throw new Error('tree data: item has no `id` or `key` property — pass getKey')
	}

	return key
}

function defaultGetChildren<T>(item: T): Iterable<T> {
	return ((item as { children?: Iterable<T> }).children ?? []) as Iterable<T>
}

export function createTreeData<T>(options: TreeDataOptions<T> = {}): TreeData<T> {
	const getKey = options.getKey ?? defaultGetKey
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
		nodes: TreeNode<T>[],
		key: Key,
	): { node: TreeNode<T>; siblings: TreeNode<T>[]; index: number } | null => {
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

	const childrenOf = (key: Key | null): TreeNode<T>[] =>
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
		nodes: TreeNode<T>[],
		match: (siblings: TreeNode<T>[]) => TreeNode<T>[] | null,
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

	const editSiblingsOf = (key: Key, edit: (siblings: TreeNode<T>[], index: number) => TreeNode<T>[]) => {
		const next = rebuild(snapshot.items, (siblings) => {
			const index = siblings.findIndex((node) => node.key === key)
			return index < 0 ? null : edit(siblings, index)
		})

		if (next) {
			commit({ ...snapshot, items: next })
		}
	}

	const editChildrenOf = (parentKey: Key | null, edit: (children: TreeNode<T>[]) => TreeNode<T>[]) => {
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
		const strip = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
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
		get: () => snapshot,
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
			if (!found) {
				return
			}

			// Detach first so the target index lands in the remaining siblings.
			const node = found.node
			editSiblingsOf(key, (siblings, index) => {
				const next = [...siblings]
				next.splice(index, 1)
				return next
			})

			const moved = { ...node, parentKey: toParentKey }
			editChildrenOf(toParentKey, (children) => {
				const next = [...children]
				next.splice(toIndex, 0, moved)
				return next
			})
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
