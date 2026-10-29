/**
 * Async list-data store mirroring React Aria's useAsyncList: a load()
 * function drives items, with managed loading/error state, abortable
 * requests, cursor pagination (loadMore/hasMore), sort descriptors, and
 * filterText-triggered reloads. Every operation returns a completion
 * promise — it resolves when that operation settles or is superseded and
 * never rejects, so fire-and-forget stays safe and failures are read from
 * `loadingState`/`error`. Starting an operation aborts the in-flight
 * request and drops a pending client sort; `abort()` cancels the current
 * operation explicitly. The client-side mutation surface matches ListData
 * — createListData supplies it.
 */
import { createListDataController, type Key, type ListData, type Selection } from './list-data'

import type { ReadableStore } from '../props'

/**
 * Sort request for list stores — `column` key and `direction`.
 */
export interface SortDescriptor {
	column: Key
	direction: 'ascending' | 'descending'
}

/**
 * Async list lifecycle — idle/loading/loadingMore/sorting/error states.
 */
export type LoadingState = 'loading' | 'loadingMore' | 'sorting' | 'filtering' | 'error' | 'idle'

/**
 * Arguments to an `AsyncList` `load` — `filterText`, `sortDescriptor`, `cursor` for the next page, and an `AbortSignal` for cancellation.
 */
export interface AsyncListLoadContext<C> {
	filterText: string
	sortDescriptor?: SortDescriptor
	cursor?: C
	signal: AbortSignal
}

/**
 * An `AsyncList` loader's page result — `items`, optional `cursor` (next page), optional `selectedKeys`.
 */
export interface AsyncListLoadResult<T, C> {
	items: T[]
	cursor?: C
	selectedKeys?: Selection | Iterable<Key>
}

/**
 * Options for `useAsyncList`/`createAsyncList` — required `load`, optional client `sort`, `initial*` state (read once), `getKey`. Without `sort`, sorting reloads through `load` (server-side).
 */
export interface AsyncListOptions<T, C = string> {
	load: (state: AsyncListLoadContext<C>) => Promise<AsyncListLoadResult<T, C>>
	/** Client-side sort; when omitted, sort() reloads through `load` with the
	 *  descriptor (server-side sort). `state.items` is the current readonly
	 *  snapshot — return a new array rather than mutating it. */
	sort?: (state: {
		items: readonly T[]
		sortDescriptor: SortDescriptor
	}) => { items: T[] } | Promise<{ items: T[] }>
	initialSelectedKeys?: 'all' | Iterable<Key>
	initialFilterText?: string
	initialSortDescriptor?: SortDescriptor
	getKey?: (item: T) => Key
}

/**
 * Immutable snapshot of an `AsyncListData` — `items`, `filterText`, `selectedKeys`, `sortDescriptor`, `loadingState`, and `error`.
 */
export interface AsyncListSnapshot<T> {
	readonly items: readonly T[]
	readonly filterText: string
	readonly selectedKeys: Selection
	readonly sortDescriptor?: SortDescriptor
	readonly loadingState: LoadingState
	readonly error?: Error
	/** Whether a next page can be requested — true while the last load
	 *  returned a pagination cursor. */
	readonly hasMore: boolean
}

/**
 * React Aria `useAsyncList`-compatible store — paged `load`, optional client `sort`, filter text, selection, and `reload`/`loadMore`. The reactive read is `useAsyncList`/`useStore`.
 * Complete replacements retain selection for surviving keys and prune removed
 * keys; an explicit loader `selectedKeys` overrides the retained selection.
 */
export interface AsyncListData<T>
	extends
		ReadableStore<AsyncListSnapshot<T>>,
		Omit<ListData<T>, 'getSnapshot' | 'subscribe' | 'setFilterText'> {
	readonly loadingState: LoadingState
	readonly isLoading: boolean
	readonly error?: Error
	readonly sortDescriptor?: SortDescriptor
	/** Whether a next page can be requested — true while the last load
	 *  returned a pagination cursor. */
	readonly hasMore: boolean
	/** First page / refresh. The hook fires this on mount. Resolves when this
	 *  reload settles — or when a newer operation supersedes it — and never
	 *  rejects: inspect `loadingState`/`error` for the outcome. Starting any
	 *  operation aborts an in-flight request and drops its result, so a retry
	 *  is simply calling `reload()` again after `'error'`. */
	reload(): Promise<void>
	/** Fetch the next page using the cursor returned by the previous load.
	 *  Resolves when the page load settles or is superseded; resolves
	 *  immediately without fetching while `hasMore` is false or another
	 *  operation is in flight (check `isLoading`). A `'error'` result keeps
	 *  the cursor, so a retry is another `loadMore()`. */
	loadMore(): Promise<void>
	/** Sort via `options.sort` (client) or a descriptor-triggered reload
	 *  (server). Resolves when the sort settles or is superseded. */
	sort(descriptor: SortDescriptor): Promise<void>
	/** Update the filter text and reload through `load`. Resolves when the
	 *  reload settles or is superseded; resolves immediately when the text
	 *  is unchanged. */
	setFilterText(filterText: string): Promise<void>
	/** Cancel the in-flight request or pending client sort, dropping its
	 *  result; a load that ignores its `signal` cannot publish afterward.
	 *  The list returns to `'idle'`, or to `'error'` when an earlier error
	 *  still stands. No-op when nothing is pending. */
	abort(): void
}

const ACTIVE: ReadonlySet<LoadingState> = new Set([
	'loading',
	'loadingMore',
	'sorting',
	'filtering',
])

/** The current async operation — a request (abortable via `controller`) or
 *  a pending client sort (result dropped via the ticket check instead). */
interface AsyncListOperation {
	ticket: number
	controller?: AbortController
	settle: () => void
}

export function createAsyncListData<T, C = string>(
	options: AsyncListOptions<T, C>,
): AsyncListData<T> {
	const collection = createListDataController<T>({
		initialSelectedKeys: options.initialSelectedKeys,
		initialFilterText: options.initialFilterText,
		getKey: options.getKey,
	})

	const base = collection.list
	let sortDescriptor = options.initialSortDescriptor
	let loadingState: LoadingState = 'idle'
	let error: Error | undefined
	let cursor: C | undefined
	let current: AsyncListOperation | undefined
	let ticket = 0

	const makeSnapshot = (): AsyncListSnapshot<T> => ({
		items: base.getSnapshot().items,
		filterText: base.getSnapshot().filterText,
		selectedKeys: base.getSnapshot().selectedKeys,
		sortDescriptor,
		loadingState,
		error,
		hasMore: cursor !== undefined,
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

	// Overlap rule: every operation supersedes the previous one — aborting
	// its request, dropping a pending client sort, and resolving its
	// completion promise.
	const supersede = () => {
		const op = current
		current = undefined
		op?.controller?.abort()
		op?.settle()
	}

	// Start an operation: returns its ticket, abort controller (requests
	// only), the completion promise, and finish() to settle it. finish() is
	// also safe to call after supersede() already resolved the promise.
	const beginOperation = (kind: LoadingState, abortable: boolean) => {
		supersede()
		const mine = ++ticket
		let settle!: () => void
		const completed = new Promise<void>((resolve) => {
			settle = resolve
		})

		const controller = abortable ? new AbortController() : undefined
		current = { ticket: mine, controller, settle }
		phase(kind)
		const finish = () => {
			if (current?.ticket === mine) {
				current = undefined
			}

			settle()
		}

		return { mine, controller, completed, finish }
	}

	const run = (kind: LoadingState, nextCursor?: C): Promise<void> => {
		const { mine, controller, completed, finish } = beginOperation(kind, true)
		const signal = controller!.signal
		void (async () => {
			try {
				const result = await options.load({
					filterText: base.filterText,
					sortDescriptor,
					cursor: nextCursor,
					signal,
				})

				if (mine !== ticket || signal.aborted) {
					return
				}

				const items =
					nextCursor === undefined ? result.items : [...base.getSnapshot().items, ...result.items]

				cursor = result.cursor
				error = undefined
				loadingState = 'idle'
				collection.replace(items, result.selectedKeys)
			} catch (e) {
				if (mine !== ticket || signal.aborted) {
					return
				}

				error = e instanceof Error ? e : new Error(String(e))
				phase('error')
			}
		})().then(finish, finish)

		return completed
	}
	return {
		getSnapshot: () => snap,
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
		get hasMore() {
			return cursor !== undefined
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
				return Promise.resolve()
			}

			base.setFilterText(filterText)
			// Reload on filter change — RA fires load with the new filterText.
			cursor = undefined
			return run('filtering')
		},
		reload() {
			cursor = undefined
			return run('loading')
		},
		loadMore() {
			if (ACTIVE.has(loadingState) || cursor === undefined) {
				return Promise.resolve()
			}

			return run('loadingMore', cursor)
		},
		sort(descriptor) {
			sortDescriptor = descriptor
			emit()
			if (options.sort) {
				// No request to abort — the ticket check drops a superseded
				// sort's result instead of letting it publish over a newer op.
				const { mine, completed, finish } = beginOperation('sorting', false)
				Promise.resolve()
					.then(() =>
						options.sort!({ items: base.getSnapshot().items, sortDescriptor: descriptor }),
					)
					.then(
						(result) => {
							if (mine !== ticket) {
								return
							}

							error = undefined
							loadingState = 'idle'
							collection.replace(result.items)
						},
						(e) => {
							if (mine !== ticket) {
								return
							}

							error = e instanceof Error ? e : new Error(String(e))
							phase('error')
						},
					)
					.then(finish, finish)

				return completed
			}

			cursor = undefined
			return run('sorting')
		},
		abort() {
			if (current === undefined) {
				return
			}

			supersede()
			phase(error === undefined ? 'idle' : 'error')
		},
	}
}
