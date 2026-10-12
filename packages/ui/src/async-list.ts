/**
 * Async list-data store mirroring React Aria's useAsyncList: a load()
 * function drives items, with managed loading/error state, abortable
 * requests, cursor pagination (loadMore), sort descriptors, and
 * filterText-triggered reloads. The client-side mutation surface matches
 * ListData — createListData supplies it.
 */
import {
	createListData,
	type Key,
	type ListData,
	type Selection,
} from './list-data'
import type { ReadableStore } from './props'

export interface SortDescriptor {
	column: Key
	direction: 'ascending' | 'descending'
}

export type LoadingState = 'loading' | 'loadingMore' | 'sorting' | 'filtering' | 'error' | 'idle'

export interface AsyncListLoadContext<C> {
	filterText: string
	sortDescriptor?: SortDescriptor
	cursor?: C
	signal: AbortSignal
}

export interface AsyncListLoadResult<T, C> {
	items: T[]
	cursor?: C
	selectedKeys?: Selection | Iterable<Key>
}

export interface AsyncListOptions<T, C = string> {
	load: (state: AsyncListLoadContext<C>) => Promise<AsyncListLoadResult<T, C>>
	/** Client-side sort; when omitted, sort() reloads through `load` with the
	 *  descriptor (server-side sort). */
	sort?: (state: {
		items: T[]
		sortDescriptor: SortDescriptor
	}) => { items: T[] } | Promise<{ items: T[] }>
	initialSelectedKeys?: Selection | Iterable<Key>
	initialFilterText?: string
	initialSortDescriptor?: SortDescriptor
	getKey?: (item: T) => Key
}

export interface AsyncListSnapshot<T> {
	items: T[]
	filterText: string
	selectedKeys: Selection
	sortDescriptor?: SortDescriptor
	loadingState: LoadingState
	error?: Error
}

export interface AsyncListData<T>
	extends ReadableStore<AsyncListSnapshot<T>>, Omit<ListData<T>, 'get' | 'subscribe' | 'setFilterText'> {
	readonly loadingState: LoadingState
	readonly isLoading: boolean
	readonly error?: Error
	readonly sortDescriptor?: SortDescriptor
	/** First page / refresh. The hook fires this on mount. */
	reload(): void
	/** Fetch the next page using the cursor returned by the previous load. */
	loadMore(): void
	/** Sort via `options.sort` (client) or a descriptor-triggered reload (server). */
	sort(descriptor: SortDescriptor): void
	setFilterText(filterText: string): void
}

const ACTIVE: ReadonlySet<LoadingState> = new Set(['loading', 'loadingMore', 'sorting', 'filtering'])

function defaultGetKey<T>(item: T): Key {
	const key = (item as { id?: Key }).id ?? (item as { key?: Key }).key
	if (key == null) {
		throw new Error('async list: item has no `id` or `key` property — pass getKey')
	}

	return key
}

export function createAsyncListData<T, C = string>(
	options: AsyncListOptions<T, C>,
): AsyncListData<T> {
	const getKey = options.getKey ?? defaultGetKey
	const base = createListData<T>({
		initialSelectedKeys: options.initialSelectedKeys,
		initialFilterText: options.initialFilterText,
		getKey: options.getKey,
	})

	let sortDescriptor = options.initialSortDescriptor
	let loadingState: LoadingState = 'idle'
	let error: Error | undefined
	let cursor: C | undefined
	let inFlight: { ticket: number; controller: AbortController } | undefined
	let ticket = 0

	const makeSnapshot = (): AsyncListSnapshot<T> => ({
		items: base.get().items,
		filterText: base.get().filterText,
		selectedKeys: base.get().selectedKeys,
		sortDescriptor,
		loadingState,
		error,
	})

	// useSyncExternalStore requires identity-stable snapshots — rebuild on
	// change, never per get() call.
	let snap = makeSnapshot()
	const listeners = new Set<() => void>()
	const emit = () => {
		snap = makeSnapshot()
		for (const listener of [...listeners]) {
			listener()
		}
	}

	// Base mutations flow through the same snapshot/emission path.
	base.subscribe(() => emit())

	const phase = (next: LoadingState) => {
		loadingState = next
		emit()
	}

	const run = async (kind: LoadingState, nextCursor?: C) => {
		inFlight?.controller.abort()
		const controller = new AbortController()
		const mine = ++ticket
		inFlight = { ticket: mine, controller }
		phase(kind)
		try {
			const result = await options.load({
				filterText: base.filterText,
				sortDescriptor,
				cursor: nextCursor,
				signal: controller.signal,
			})
			if (mine !== ticket || controller.signal.aborted) {
				return
			}

			const items = nextCursor === undefined ? result.items : [...base.get().items, ...result.items]
			replaceItems(items)
			cursor = result.cursor
			if (result.selectedKeys !== undefined) {
				base.setSelectedKeys(result.selectedKeys)
			}

			error = undefined
			phase('idle')
		} catch (e) {
			if (mine !== ticket || controller.signal.aborted) {
				return
			}

			error = e instanceof Error ? e : new Error(String(e))
			phase('error')
		}
	}

	// createListData owns item mutation; wholesale replacement goes through
	// remove()+append() so selection pruning stays in one place.
	const replaceItems = (items: T[]) => {
		base.remove(...base.get().items.map(getKey))
		base.append(...items)
	}

	return {
		get: () => snap,
		subscribe(notify) {
			listeners.add(notify)
			return () => {
				listeners.delete(notify)
			}
		},
		get items() {
			return base.items
		},
		get filterText() {
			return base.filterText
		},
		get selectedKeys() {
			return base.selectedKeys
		},
		get loadingState() {
			return loadingState
		},
		get isLoading() {
			return ACTIVE.has(loadingState)
		},
		get error() {
			return error
		},
		get sortDescriptor() {
			return sortDescriptor
		},
		getItem: base.getItem,
		insert: base.insert,
		insertBefore: base.insertBefore,
		insertAfter: base.insertAfter,
		append: base.append,
		prepend: base.prepend,
		remove: base.remove,
		removeSelectedItems: base.removeSelectedItems,
		move: base.move,
		moveBefore: base.moveBefore,
		moveAfter: base.moveAfter,
		update: base.update,
		setSelectedKeys: base.setSelectedKeys,
		setFilterText(filterText) {
			if (filterText === base.filterText) {
				return
			}

			base.setFilterText(filterText)
			// Reload on filter change — RA fires load with the new filterText.
			cursor = undefined
			void run('filtering')
		},
		reload() {
			cursor = undefined
			void run('loading')
		},
		loadMore() {
			if (loadingState !== 'idle' || cursor === undefined) {
				return
			}

			void run('loadingMore', cursor)
		},
		sort(descriptor) {
			sortDescriptor = descriptor
			emit()
			if (options.sort) {
				phase('sorting')
				Promise.resolve(options.sort({ items: base.get().items, sortDescriptor: descriptor }))
					.then((result) => {
						replaceItems(result.items)
						phase('idle')
					})
					.catch((e) => {
						error = e instanceof Error ? e : new Error(String(e))
						phase('error')
					})
				return
			}

			cursor = undefined
			void run('sorting')
		},
	}
}
