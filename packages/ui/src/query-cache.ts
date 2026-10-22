/** Shared queries with explicit definition, reader, and client lifetimes. */
import { createScope, type DerivedSignal, type Scope, type WritableSignal } from 'octane/signals'

/** JSON values accepted in query keys and selections. Object field order is ignored. */
export type QueryKeyPart =
	| string
	| number
	| boolean
	| null
	| readonly QueryKeyPart[]
	| {
			readonly [field: string]: QueryKeyPart | undefined
	  }

/** Family keys prefix the full key, which appends one canonical selection. */
export type QueryKey = readonly QueryKeyPart[]
/** Durable string storage; failures never prevent an in-memory read. */
export interface QueryStorageAdapter {
	get(key: string): string | null | undefined | PromiseLike<string | null | undefined>
	set(key: string, value: string): void | PromiseLike<void>
	remove(key: string): void | PromiseLike<void>
}

/** Opt-in confirmed JSON records, partitioned by the client's immutable namespace. */
export interface QueryPersistence {
	readonly storage: QueryStorageAdapter
	readonly version: string | number
	/** Maximum stored age in milliseconds. @default Infinity */
	readonly maxAgeMs?: number
}

/** Loader inputs. Always pass signal to an abortable transport. */
export interface QueryLoadContext<T> {
	readonly signal: AbortSignal
	readonly previous: T | undefined
}

/** Definition-wide policies; all readers of an entry use the same policy. */
export interface QueryOptions {
	/** Freshness in milliseconds. @default 0 */
	readonly staleTimeMs?: number
	readonly persist?: QueryPersistence
}

const DEFINITION = Symbol('query-definition')
/** Reusable typed loader and family identity. Construct once with defineQuery. */
export interface QueryDefinition<A extends QueryKeyPart, T> {
	readonly [DEFINITION]: true
	readonly key: QueryKey
	readonly load: (selection: A, context: QueryLoadContext<T>) => T | PromiseLike<T>
	readonly options: QueryOptions
}

/** Observable state. A refresh failure can coexist with usable confirmed data. */
export interface QueryState {
	readonly status: 'pending' | 'ready' | 'error'
	readonly fetchStatus: 'idle' | 'fetching'
	readonly hasData: boolean
	readonly error: unknown
	readonly updatedAtMs: number
}

/** One explicit observation lease. dispose releases only this reader. */
export interface QueryReader<T> {
	/** Native signal: get suspends until first data; refreshes retain that data. */
	readonly data$: DerivedSignal<T>
	readonly state$: DerivedSignal<QueryState>
	/** Resolves with data or rejects with the loader/cancellation error. */
	refetch(): Promise<T>
	dispose(): void
}

/** Match a prefix, or an entire family-plus-selection key with exact. */
export interface QueryFilter {
	readonly key?: QueryKey
	readonly exact?: boolean
}

/** Memory and persistence share this immutable boundary. No global client is created. */
export interface QueryClientOptions {
	/** Required for persistent definitions. Use a new client when an account changes. */
	readonly namespace?: string
}

/** Explicit disposal options. Durable purge waits behind outstanding storage operations. */
export interface QueryDisposeOptions {
	readonly purgePersisted?: boolean
}

/** An app/account/request cache. Dispose it at that boundary's end. */
export interface QueryClient {
	/** Acquire outside rendering; components use useQuery$ for commit-time ownership. */
	observe$<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
	): QueryReader<T>
	invalidateQueries(filter?: QueryFilter): void
	/** Retires matching readers. Collection alone does not delete durable data. */
	evictQueries(filter?: QueryFilter, options?: QueryDisposeOptions): Promise<void>
	/** Retires signals and aborts work synchronously; returns durable purge completion. */
	dispose(options?: QueryDisposeOptions): Promise<void>
}

/**
 * Declare one family once, outside rendering. Two different definitions with the
 * same family in one client are rejected instead of silently choosing a loader.
 * @example
 * import { defineQuery } from '@octane-xplat/ui/data'
 * const users = defineQuery(['users'], async (id: string, { signal }) => {
 *   const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal })
 *   if (!response.ok) throw new Error('Could not load user')
 *   return response.json() as Promise<{ name: string }>
 * })
 */
export function defineQuery<A extends QueryKeyPart, T>(
	key: QueryKey,
	load: (selection: A, context: QueryLoadContext<T>) => T | PromiseLike<T>,
	options: QueryOptions = {},
): QueryDefinition<A, T> {
	if (key.length === 0) {
		throw new TypeError('A query family must have a non-empty key')
	}
	if (typeof load !== 'function') {
		throw new TypeError('A query definition requires a loader')
	}
	validateDuration(options.staleTimeMs, 'staleTimeMs')
	validateDuration(options.persist?.maxAgeMs, 'maxAgeMs')
	return Object.freeze({
		[DEFINITION]: true as const,
		key: freezeJson(JSON.parse(canonicalQueryKey(key))) as QueryKey,
		load,
		options: Object.freeze({
			...options,
			...(options.persist ? { persist: Object.freeze({ ...options.persist }) } : {}),
		}),
	})
}

function validateDuration(value: number | undefined, name: string): void {
	if (value !== undefined && (value < 0 || Number.isNaN(value))) {
		throw new TypeError(`${name} must be a non-negative millisecond duration`)
	}
}

function freezeJson(value: unknown): unknown {
	if (value !== null && typeof value === 'object') {
		for (const child of Object.values(value)) {
			freezeJson(child)
		}

		Object.freeze(value)
	}
	return value
}

/** @internal Stable JSON identity shared with the hook; rejects ambiguous non-JSON inputs. */
export function canonicalQueryKey(value: unknown, parents = new Set<object>()): string {
	if (value === null) {
		return 'null'
	}
	if (typeof value === 'string' || typeof value === 'boolean') {
		return JSON.stringify(value)
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return JSON.stringify(value)
	}
	if (typeof value !== 'object') {
		throw new TypeError('Query identity must contain JSON values')
	}
	if (parents.has(value)) {
		throw new TypeError('Query identity cannot contain cycles')
	}
	const prototype = Object.getPrototypeOf(value)
	if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
		throw new TypeError('Query identity must contain plain objects')
	}
	parents.add(value)
	try {
		if (Array.isArray(value)) {
			return `[${value.map((part) => canonicalQueryKey(part, parents)).join(',')}]`
		}

		const object = value as Record<string, unknown>
		return `{${Object.keys(object)
			.sort()
			.filter((key) => object[key] !== undefined)
			.map((key) => `${JSON.stringify(key)}:${canonicalQueryKey(object[key], parents)}`)
			.join(',')}}`
	} finally {
		parents.delete(value)
	}
}

interface PersistenceTarget {
	storage: QueryStorageAdapter
	key: string
	version: string | number
	maxAgeMs: number
}

interface Entry<T = unknown> {
	id: string
	elements: readonly string[]
	scope: Scope
	value$: WritableSignal<T | undefined>
	state$: WritableSignal<QueryState>
	data$: DerivedSignal<T>
	stateView$: DerivedSignal<QueryState>
	definition: QueryDefinition<QueryKeyPart, T>
	selection: QueryKeyPart
	readers: number
	retired: boolean
	invalidated: boolean
	invalidationVersion: number
	revision: number
	controller?: AbortController
	inflight?: Promise<T>
	restoring?: Promise<void>
	restored: boolean
	persist?: PersistenceTarget
}

let clientSequence = 0
let entrySequence = 0
const storageTails = new WeakMap<QueryStorageAdapter, Map<string, Promise<void>>>()
function storageOperation<T>(target: PersistenceTarget, run: () => T | PromiseLike<T>): Promise<T> {
	let tails = storageTails.get(target.storage)
	if (!tails) {
		storageTails.set(target.storage, (tails = new Map()))
	}
	const result = (tails.get(target.key) ?? Promise.resolve()).then(run)
	const tail = result.then(
		() => {},
		() => {},
	)
	tails.set(target.key, tail)
	void tail.then(() => {
		if (tails.get(target.key) === tail) {
			tails.delete(target.key)
		}
	})
	return result
}

function cancellation(): Error {
	return Object.assign(new Error('Query work was cancelled'), { name: 'AbortError' })
}

function assertEntry(entry: { retired: boolean }): void {
	if (entry.retired) {
		throw cancellation()
	}
}

function writePersisted<T>(entry: Entry<T>): void {
	const target = entry.persist
	if (!target || entry.retired || !entry.state$.get().hasData) {
		return
	}
	try {
		const record = JSON.stringify({
			v: target.version,
			t: entry.state$.get().updatedAtMs,
			d: entry.value$.get(),
		})

		void storageOperation(target, () => {
			if (!entry.retired) {
				return target.storage.set(target.key, record)
			}
		}).catch(() => {})
	} catch {
		/* Storage is best-effort; a non-JSON value remains usable in memory. */
	}
}

function publish<T>(entry: Entry<T>, value: T, time = Date.now()): void {
	assertEntry(entry)
	entry.scope.batch(() => {
		entry.value$.set(value)
		entry.state$.set({
			status: 'ready',
			fetchStatus: 'idle',
			hasData: true,
			error: undefined,
			updatedAtMs: time,
		})
	})
}

async function restore<T>(entry: Entry<T>): Promise<void> {
	entry.restored = true
	const target = entry.persist
	if (!target) {
		return
	}
	const revision = entry.revision
	try {
		const raw = await storageOperation(target, () => target.storage.get(target.key))
		if (entry.retired || entry.revision !== revision || raw == null) {
			return
		}

		try {
			const record = JSON.parse(raw)
			if (
				!record ||
				record.v !== target.version ||
				!Number.isFinite(record.t) ||
				Date.now() - record.t > target.maxAgeMs ||
				!Object.hasOwn(record, 'd')
			) {
				throw new Error('Invalid persisted query')
			}

			publish(entry, record.d, record.t)
		} catch {
			await storageOperation(target, () => target.storage.remove(target.key))
		}
	} catch {
		/* A failed restore falls through to the loader. */
	}
}

function stale<T>(entry: Entry<T>): boolean {
	return (
		entry.invalidated ||
		!entry.state$.get().hasData ||
		Date.now() - entry.state$.get().updatedAtMs >= (entry.definition.options.staleTimeMs ?? 0)
	)
}

function load<T>(entry: Entry<T>, force = false): Promise<T> {
	assertEntry(entry)
	if (entry.inflight) {
		return entry.inflight
	}
	if (!force && !stale(entry)) {
		return Promise.resolve(entry.value$.get()!)
	}
	const controller = new AbortController()
	entry.controller = controller
	const revision = ++entry.revision
	const abort = new Promise<never>((_, reject) => {
		controller.signal.addEventListener('abort', () => reject(cancellation()), { once: true })
	})
	const work = async (): Promise<T> => {
		if (!force && !entry.restored) {
			entry.restoring ??= restore(entry).finally(() => {
				entry.restoring = undefined
			})

			await entry.restoring
			assertEntry(entry)
			if (!stale(entry)) {
				return entry.value$.get()!
			}
		}
		let value: T
		let version: number
		do {
			assertEntry(entry)
			if (controller.signal.aborted) {
				throw cancellation()
			}

			version = entry.invalidationVersion
			entry.state$.set({ ...entry.state$.get(), fetchStatus: 'fetching', error: undefined })
			value = await entry.definition.load(entry.selection, {
				signal: controller.signal,
				previous: entry.value$.get(),
			})
		} while (entry.invalidationVersion !== version)
		assertEntry(entry)
		if (controller.signal.aborted) {
			throw cancellation()
		}
		if (entry.revision === revision) {
			entry.invalidated = false
			publish(entry, value)
			writePersisted(entry)
		}
		return entry.value$.get()!
	}
	// Defer loader execution until inflight is installed: readers share even synchronous loaders.
	const request = Promise.race([Promise.resolve().then(work), abort])
	entry.inflight = request
	void request.then(
		() => finish(false),
		(error) => finish(true, error),
	)
	function finish(failed: boolean, error?: unknown): void {
		if (entry.retired || entry.inflight !== request) {
			return
		}
		entry.inflight = undefined
		entry.controller = undefined
		const state = entry.state$.get()
		entry.state$.set({
			...state,
			fetchStatus: 'idle',
			...(failed ? { status: 'error' as const, error } : {}),
		})
	}
	return request
}

function matches(entry: Pick<Entry, 'elements'>, filter: QueryFilter): boolean {
	const prefix = filter.key?.map((part) => canonicalQueryKey(part)) ?? []
	return (
		(!filter.exact || prefix.length === entry.elements.length) &&
		prefix.length <= entry.elements.length &&
		prefix.every((part, index) => part === entry.elements[index])
	)
}

/**
 * Create a cache for one app/account/request. There is no process-wide fallback.
 * @example
 * import { createQueryClient } from '@octane-xplat/ui/data'
 * const queries = createQueryClient({ namespace: 'account:42' })
 * // On sign-out: await queries.dispose({ purgePersisted: true })
 */
export function createQueryClient(options: QueryClientOptions = {}): QueryClient {
	const namespace = options.namespace
	const id = ++clientSequence
	const entries = new Map<string, Entry>()
	const definitions = new Map<string, QueryDefinition<QueryKeyPart, unknown>>()
	const persistence = new Map<string, PersistenceTarget>()
	let disposed = false
	function assertClient(): void {
		if (disposed) {
			throw new Error('Query client is disposed')
		}
	}
	function entryFor$<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
	): Entry<T> {
		assertClient()
		if (!definition[DEFINITION]) {
			throw new TypeError('Use defineQuery to create a query definition')
		}
		const family = canonicalQueryKey(definition.key)
		const registered = definitions.get(family)
		if (registered && registered !== definition) {
			throw new TypeError('A different query definition already owns this family')
		}
		definitions.set(family, definition as QueryDefinition<QueryKeyPart, unknown>)
		const elements = [
			...definition.key.map((part) => canonicalQueryKey(part)),
			canonicalQueryKey(selection),
		]
		const key = JSON.stringify(elements)
		const existing = entries.get(key)
		if (existing) {
			return existing as unknown as Entry<T>
		}
		const persist = definition.options.persist
		if (persist && !namespace) {
			throw new Error('Persistent queries require a non-empty client namespace')
		}
		const scope = createScope({ scopeKey: `xplat:query:${id}:${++entrySequence}` })
		const value$ = scope.signal$<T | undefined>('value', undefined)
		const state$ = scope.signal$<QueryState>('state', {
			status: 'pending',
			fetchStatus: 'idle',
			hasData: false,
			error: undefined,
			updatedAtMs: 0,
		})
		const entry: Entry<T> = {
			id: key,
			elements,
			scope,
			value$,
			state$,
			definition: definition as unknown as QueryDefinition<QueryKeyPart, T>,
			selection: freezeJson(JSON.parse(canonicalQueryKey(selection))) as QueryKeyPart,
			readers: 0,
			retired: false,
			invalidated: false,
			invalidationVersion: 0,
			revision: 0,
			restored: false,
			data$: scope.derived$<unknown>('data', () => {
				const state = state$.get()
				if (state.hasData) {
					return value$.get() as T
				}
				if (state.status === 'error') {
					throw state.error
				}
				throw entry.inflight ?? cancellation()
			}) as DerivedSignal<T>,
			stateView$: scope.derived$('state-view', () => state$.get()),
		}
		if (persist) {
			entry.persist = {
				...persist,
				key: `xplat:query:${JSON.stringify([namespace, elements])}`,
				maxAgeMs: persist.maxAgeMs ?? Infinity,
			}

			persistence.set(entry.persist.key, entry.persist)
		}
		entries.set(key, entry as unknown as Entry)
		return entry
	}
	function retire(entry: Entry): void {
		entry.retired = true
		entry.controller?.abort()
		entry.scope.dispose()
		entries.delete(entry.id)
	}
	return {
		observe$(definition, selection) {
			const entry = entryFor$(definition, selection)
			entry.readers++
			void load(entry).catch(() => {})
			let released = false
			return {
				data$: entry.data$,
				state$: entry.stateView$,
				refetch: () => {
					if (released) {
						return Promise.reject(new Error('Query reader is disposed'))
					}
					return load(entry, true)
				},
				dispose() {
					if (released) {
						return
					}
					released = true
					entry.readers--
				},
			}
		},
		invalidateQueries(filter = {}) {
			assertClient()
			for (const entry of entries.values()) {
				if (matches(entry, filter)) {
					entry.invalidated = true
					entry.invalidationVersion++
					if (entry.readers > 0) {
						void load(entry, true).catch(() => {})
					}
				}
			}
		},
		evictQueries(filter = {}, eviction = {}) {
			assertClient()
			const removals: Promise<void>[] = []
			for (const entry of [...entries.values()]) {
				if (matches(entry, filter)) {
					retire(entry)
					if (eviction.purgePersisted && entry.persist) {
						const target = entry.persist
						removals.push(storageOperation(target, () => target.storage.remove(target.key)))
					}
				}
			}
			return Promise.all(removals).then(() => {})
		},
		dispose(disposal = {}) {
			disposed = true
			for (const entry of [...entries.values()]) {
				retire(entry)
			}
			definitions.clear()
			const targets = [...persistence.values()]
			return disposal.purgePersisted
				? Promise.all(
						targets.map((target) =>
							storageOperation(target, () => target.storage.remove(target.key)),
						),
					).then(() => {})
				: Promise.resolve()
		},
	}
}

/** In-memory durable-adapter fixture for tests and small examples. */
export function createMemoryQueryStorage(): QueryStorageAdapter {
	const store = new Map<string, string>()
	return {
		get: (key) => store.get(key) ?? null,
		set: (key, value) => {
			store.set(key, value)
		},
		remove: (key) => {
			store.delete(key)
		},
	}
}
