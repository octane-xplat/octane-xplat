import { environment as platformEnvironment } from '@octane-xplat/platform/environment'
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
	/** Retain inactive entries for this many milliseconds. @default 300000 */
	readonly gcTimeMs?: number
	readonly persist?: QueryPersistence
	/** Retries after the initial attempt. Abort errors are never retried. @default 2 */
	readonly retryCount?: number
	/** Milliseconds before retry; failureCount starts at 1. @default exponential 1000–30000 */
	readonly retryDelayMs?: number | ((failureCount: number, error: unknown) => number)
	/** Additional application decision within retryCount's maximum. */
	readonly shouldRetry?: (failureCount: number, error: unknown) => boolean
	/** Remote queries wait when the host is known offline. @default 'online' */
	readonly networkMode?: 'online' | 'always'
	/** Refresh stale observed entries when the app resumes. @default true */
	readonly refetchOnResume?: boolean
	/** Refresh stale observed entries after reconnecting. @default true */
	readonly refetchOnReconnect?: boolean
	/** Poll observed entries in milliseconds; 0 disables. Pauses offline/background. @default 0 */
	readonly refetchIntervalMs?: number
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
	readonly fetchStatus: 'idle' | 'fetching' | 'paused'
	readonly failureCount: number
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

/** Host state: missing connectivity/activity is unknown and does not block requests. */
export interface QueryEnvironmentSnapshot {
	readonly online?: boolean
	readonly active?: boolean
	readonly capabilities?: { readonly connectivity: boolean; readonly activity: boolean }
}

/** Injectable host boundary. Subscriptions must return their own cleanup. */
export interface QueryEnvironment {
	getSnapshot(): QueryEnvironmentSnapshot
	subscribe(listener: (snapshot: QueryEnvironmentSnapshot) => void): () => void
}

/** Memory and persistence share this immutable boundary. No global client is created. */
export interface QueryClientOptions {
	/** Required for persistent definitions. Use a new client when an account changes. */
	readonly namespace?: string
	readonly environment?: QueryEnvironment
}

/** Explicit disposal options. Durable purge waits behind outstanding storage operations. */
export interface QueryDisposeOptions {
	readonly purgePersisted?: boolean
}

/** A complete confirmed value, or a pure immutable update from the current value. */
export type QueryUpdater<T> = T | ((previous: T | undefined) => T)

/** Cancellation belongs to the caller's lease, not the shared transport. */
export interface QueryOperationOptions {
	readonly signal?: AbortSignal
}

/** Prefetch always settles with an explicit outcome; ensureData returns data or rejects. */
export type QueryPrefetchResult =
	| { readonly status: 'success' }
	| { readonly status: 'error'; readonly error: unknown }
	| { readonly status: 'cancelled' }

/** An app/account/request cache. Dispose it at that boundary's end. */
export interface QueryClient {
	/** Acquire outside rendering; components use useQuery$ for commit-time ownership. */
	observe$<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
	): QueryReader<T>
	/** Return fresh data through the shared scheduler without a component owner. */
	ensureData<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
		options?: QueryOperationOptions,
	): Promise<T>
	/** Warm the same entry as readers; errors are returned rather than rejected. */
	prefetch<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
		options?: QueryOperationOptions,
	): Promise<QueryPrefetchResult>
	/** Read confirmed authority without creating an entry or fetching. */
	getQueryData<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
	): T | undefined
	/** Publish confirmed data, fence older reads/restores, and reset its freshness time. */
	setQueryData<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
		update: QueryUpdater<NoInfer<T>>,
	): void
	/** Update matching existing, settled entries of this definition; never invent entries. */
	setQueriesData<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		update: (previous: NoInfer<T>, selection: NoInfer<A>) => NoInfer<T>,
		filter?: QueryFilter,
	): number
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
	validateDuration(options.gcTimeMs, 'gcTimeMs')
	validateDuration(options.refetchIntervalMs, 'refetchIntervalMs')
	if (
		options.retryCount !== undefined &&
		(!Number.isSafeInteger(options.retryCount) || options.retryCount < 0)
	) {
		throw new TypeError('retryCount must be a non-negative integer')
	}
	if (typeof options.retryDelayMs === 'number') {
		validateDuration(options.retryDelayMs, 'retryDelayMs')
	}
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

function applyUpdate<T>(update: QueryUpdater<T>, previous: T | undefined): T {
	return typeof update === 'function' ? (update as (current: T | undefined) => T)(previous) : update
}

interface StorageTarget {
	storage: QueryStorageAdapter
	key: string
}

interface NamespaceTarget extends StorageTarget {
	recordPrefix: string
}

interface PersistenceTarget extends StorageTarget {
	namespace: NamespaceTarget
	storage: QueryStorageAdapter
	key: string
	version: string | number
	maxAgeMs: number
}

interface Entry<T = unknown> {
	id: string
	family: string
	leases: number
	gcTimer?: ReturnType<typeof setTimeout>
	pollTimer?: ReturnType<typeof setTimeout>
	environmentRefreshPending?: boolean
	environment(): QueryEnvironmentSnapshot
	wake?: () => void
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
function storageOperation<T>(target: StorageTarget, run: () => T | PromiseLike<T>): Promise<T> {
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

		void storageOperation(target.namespace, async () => {
			if (entry.retired) {
				return
			}
			const keys = await persistedKeys(target.namespace)
			if (!keys.includes(target.key)) {
				keys.push(target.key)
				await target.storage.set(target.namespace.key, JSON.stringify(keys))
			}
			if (!entry.retired) {
				await storageOperation(target, () => target.storage.set(target.key, record))
			}
		}).catch(() => {})
	} catch {
		/* Storage is best-effort; a non-JSON value remains usable in memory. */
	}
}

async function persistedKeys(target: NamespaceTarget): Promise<string[]> {
	const raw = await target.storage.get(target.key)
	if (raw == null) {
		return []
	}
	const keys: unknown = JSON.parse(raw)
	if (
		!Array.isArray(keys) ||
		!keys.every((key) => typeof key === 'string' && key.startsWith(target.recordPrefix))
	) {
		throw new Error('Invalid query persistence index')
	}
	return keys
}

function purgeNamespace(target: NamespaceTarget): Promise<void> {
	return storageOperation(target, async () => {
		const keys = await persistedKeys(target)
		await Promise.all(
			keys.map((key) => storageOperation({ ...target, key }, () => target.storage.remove(key))),
		)
		await target.storage.remove(target.key)
	})
}

function purgeRecord(target: PersistenceTarget): Promise<void> {
	return storageOperation(target.namespace, async () => {
		await storageOperation(target, () => target.storage.remove(target.key))
		const keys = (await persistedKeys(target.namespace)).filter((key) => key !== target.key)
		if (keys.length) {
			await target.storage.set(target.namespace.key, JSON.stringify(keys))
		} else {
			await target.storage.remove(target.namespace.key)
		}
	})
}

function publish<T>(entry: Entry<T>, value: T, time = Date.now()): void {
	assertEntry(entry)
	entry.scope.batch(() => {
		entry.value$.set(value)
		entry.state$.set({
			status: 'ready',
			fetchStatus: 'idle',
			failureCount: 0,
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

function wait<T>(entry: Entry<T>, signal: AbortSignal, delayMs?: number): Promise<void> {
	if (signal.aborted) {
		return Promise.reject(cancellation())
	}
	return new Promise((resolve, reject) => {
		let timer: ReturnType<typeof setTimeout> | undefined
		const cleanup = () => {
			clearTimeout(timer)
			signal.removeEventListener('abort', abort)
			if (entry.wake === wake) {
				entry.wake = undefined
			}
		}
		const wake = () => {
			cleanup()
			resolve()
		}
		const abort = () => {
			cleanup()
			reject(cancellation())
		}
		entry.wake = wake
		signal.addEventListener('abort', abort, { once: true })
		if (delayMs !== undefined) {
			timer = setTimeout(wake, Math.min(delayMs, 2_147_483_647))
		}
	})
}

async function attempt<T>(entry: Entry<T>, signal: AbortSignal): Promise<T> {
	const policy = entry.definition.options
	let failures = 0
	let generation = entry.invalidationVersion
	for (;;) {
		assertEntry(entry)
		if (signal.aborted) {
			throw cancellation()
		}

		if (generation !== entry.invalidationVersion) {
			generation = entry.invalidationVersion
			failures = 0
		}

		while (policy.networkMode !== 'always' && entry.environment().online === false) {
			entry.state$.set({ ...entry.state$.get(), fetchStatus: 'paused', failureCount: failures })
			await wait(entry, signal)
		}

		if (generation !== entry.invalidationVersion) {
			generation = entry.invalidationVersion
			failures = 0
		}

		const state = entry.state$.get()
		entry.state$.set({
			...state,
			status: state.hasData ? 'ready' : 'pending',
			fetchStatus: 'fetching',
			error: undefined,
			failureCount: failures,
		})

		try {
			const value = await entry.definition.load(entry.selection, {
				signal,
				previous: entry.value$.get(),
			})

			if (generation !== entry.invalidationVersion) {
				continue
			}

			return value
		} catch (error) {
			if (signal.aborted || (error as { name?: unknown } | null)?.name === 'AbortError') {
				throw error
			}

			if (generation !== entry.invalidationVersion) {
				continue
			}

			failures++
			entry.state$.set({ ...entry.state$.get(), error, failureCount: failures })
			if (failures > (policy.retryCount ?? 2) || policy.shouldRetry?.(failures, error) === false) {
				throw error
			}

			const delay =
				typeof policy.retryDelayMs === 'function'
					? policy.retryDelayMs(failures, error)
					: (policy.retryDelayMs ?? Math.min(1000 * 2 ** (failures - 1), 30000))

			if (!Number.isFinite(delay) || delay < 0) {
				throw new TypeError('retryDelayMs must return finite non-negative milliseconds')
			}

			const deadline = Date.now() + delay
			while (generation === entry.invalidationVersion && Date.now() < deadline) {
				if (policy.networkMode !== 'always' && entry.environment().online === false) {
					entry.state$.set({ ...entry.state$.get(), fetchStatus: 'paused' })
					await wait(entry, signal)
				} else {
					await wait(entry, signal, deadline - Date.now())
				}
			}
		}
	}
}

function armPolling<T>(entry: Entry<T>): void {
	clearTimeout(entry.pollTimer)
	entry.pollTimer = undefined
	if (entry.retired || entry.readers === 0) {
		return
	}
	const interval = entry.definition.options.refetchIntervalMs ?? 0
	const host = entry.environment()
	if (
		interval === 0 ||
		interval === Infinity ||
		host.active === false ||
		(host.online === false && entry.definition.options.networkMode !== 'always')
	) {
		return
	}
	const deadline = Date.now() + interval
	function arm(): void {
		entry.pollTimer = setTimeout(
			() => {
				if (Date.now() < deadline) {
					arm()
					return
				}
				if (entry.retired || entry.readers === 0) {
					return
				}
				void load(entry, true).then(
					() => armPolling(entry),
					() => armPolling(entry),
				)
			},
			Math.min(Math.max(0, deadline - Date.now()), 2_147_483_647),
		)
		;(entry.pollTimer as unknown as { unref?: () => void }).unref?.()
	}
	arm()
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
		const value = await attempt(entry, controller.signal)
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
	const persistence = new Map<QueryStorageAdapter, NamespaceTarget>()
	let disposed = false
	const hostEnvironment = options.environment ?? platformEnvironment
	let environment: QueryEnvironmentSnapshot = {}
	let unsubscribe: (() => void) | undefined
	let environmentGeneration = 0
	function attach(): void {
		assertClient()
		if (unsubscribe) {
			return
		}
		environment = hostEnvironment.getSnapshot()
		const generation = ++environmentGeneration
		unsubscribe = hostEnvironment.subscribe((snapshot) => {
			if (disposed || generation !== environmentGeneration) {
				return
			}
			const previous = environment
			environment = snapshot
			for (const entry of entries.values()) {
				entry.wake?.()
				armPolling(entry)
				const policy = entry.definition.options
				const refresh =
					(previous.active === false &&
						snapshot.active === true &&
						policy.refetchOnResume !== false) ||
					(previous.online === false &&
						snapshot.online === true &&
						policy.refetchOnReconnect !== false)

				if (
					refresh &&
					!entry.environmentRefreshPending &&
					entry.readers > 0 &&
					snapshot.active !== false &&
					stale(entry)
				) {
					entry.environmentRefreshPending = true
					void Promise.resolve().then(() => {
						entry.environmentRefreshPending = false
						if (
							!entry.retired &&
							entry.readers > 0 &&
							environment.active !== false &&
							environment.online !== false &&
							stale(entry)
						) {
							void load(entry, true).catch(() => {})
						}
					})
				}
			}
		})
	}
	function detachWhenIdle(): void {
		if ([...entries.values()].some((entry) => entry.leases > 0)) {
			return
		}
		environmentGeneration++
		const stop = unsubscribe
		unsubscribe = undefined
		stop?.()
	}

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
		const selectionKey = canonicalQueryKey(selection)
		const elements = [...definition.key.map((part) => canonicalQueryKey(part)), selectionKey]
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
			failureCount: 0,
			hasData: false,
			error: undefined,
			updatedAtMs: 0,
		})
		const entry: Entry<T> = {
			id: key,
			family,
			leases: 0,
			environment: () => environment,
			elements,
			scope,
			value$,
			state$,
			definition: definition as unknown as QueryDefinition<QueryKeyPart, T>,
			selection: freezeJson(JSON.parse(selectionKey)) as QueryKeyPart,
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
			let boundary = persistence.get(persist.storage)
			if (!boundary) {
				boundary = {
					storage: persist.storage,
					key: `xplat:query:index:${JSON.stringify(namespace)}`,
					recordPrefix: `xplat:query:[${JSON.stringify(namespace)},`,
				}

				persistence.set(persist.storage, boundary)
			}

			entry.persist = {
				namespace: boundary,
				...persist,
				key: `xplat:query:${JSON.stringify([namespace, elements])}`,
				maxAgeMs: persist.maxAgeMs ?? Infinity,
			}
		}
		definitions.set(family, definition as QueryDefinition<QueryKeyPart, unknown>)
		entries.set(key, entry as unknown as Entry)
		return entry
	}
	async function ensureData<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
		operation: QueryOperationOptions = {},
	): Promise<T> {
		if (operation.signal?.aborted) {
			throw cancellation()
		}
		const entry = entryFor$(definition, selection)
		clearTimeout(entry.gcTimer)
		entry.leases++
		let removeAbort = () => {}
		try {
			attach()
			const request = load(entry)
			if (!operation.signal) {
				return await request
			}

			const signal = operation.signal
			const cancelled = new Promise<never>((_, reject) => {
				const abort = () => reject(cancellation())
				signal.addEventListener('abort', abort, { once: true })
				removeAbort = () => signal.removeEventListener('abort', abort)
				if (signal.aborted) {
					abort()
				}
			})

			return await Promise.race([request, cancelled])
		} finally {
			removeAbort()
			release(entry)
		}
	}

	function existingFor$<A extends QueryKeyPart, T>(
		definition: QueryDefinition<A, T>,
		selection: A,
	): Entry<T> | undefined {
		assertClient()
		const family = canonicalQueryKey(definition.key)
		const registered = definitions.get(family)
		if (registered && registered !== definition) {
			throw new TypeError('A different query definition already owns this family')
		}
		const elements = [
			...definition.key.map((part) => canonicalQueryKey(part)),
			canonicalQueryKey(selection),
		]
		return entries.get(JSON.stringify(elements)) as unknown as Entry<T> | undefined
	}
	function write<T>(entry: Entry<T>, value: T): T {
		assertEntry(entry)
		entry.revision++
		entry.controller?.abort()
		entry.controller = undefined
		entry.inflight = undefined
		entry.invalidated = false
		publish(entry, value)
		writePersisted(entry)
		return value
	}

	function retire(entry: Entry): void {
		entry.retired = true
		clearTimeout(entry.gcTimer)
		clearTimeout(entry.pollTimer)
		entry.controller?.abort()
		entry.scope.dispose()
		entries.delete(entry.id)
		if (![...entries.values()].some((other) => other.family === entry.family)) {
			definitions.delete(entry.family)
		}
	}
	function release<T>(entry: Entry<T>): void {
		entry.leases--
		if (entry.leases > 0 || entry.retired) {
			return
		}
		clearTimeout(entry.pollTimer)
		if (entry.inflight) {
			entry.revision++
			entry.controller?.abort()
			entry.controller = undefined
			entry.inflight = undefined
			entry.invalidated = true
			const state = entry.state$.get()
			entry.state$.set({
				...state,
				status: state.hasData ? 'ready' : 'pending',
				fetchStatus: 'idle',
				error: undefined,
			})
		}
		const delay = entry.definition.options.gcTimeMs ?? 300_000
		if (delay === Infinity) {
			detachWhenIdle()
			return
		}
		const deadline = Date.now() + delay
		function arm(): void {
			entry.gcTimer = setTimeout(
				() => {
					if (entry.retired || entry.leases > 0) {
						return
					}
					if (Date.now() < deadline) {
						arm()
					} else {
						retire(entry as unknown as Entry)
					}
				},
				Math.min(Math.max(0, deadline - Date.now()), 2_147_483_647),
			)
			;(entry.gcTimer as unknown as { unref?: () => void }).unref?.()
		}
		arm()
		detachWhenIdle()
	}
	return {
		observe$(definition, selection) {
			const entry = entryFor$(definition, selection)
			attach()
			clearTimeout(entry.gcTimer)
			entry.readers++
			entry.leases++
			armPolling(entry)
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
					release(entry)
				},
			}
		},
		ensureData,
		async prefetch(definition, selection, operation) {
			try {
				await ensureData(definition, selection, operation)
				return { status: 'success' as const }
			} catch (error) {
				return (error as { name?: unknown } | null)?.name === 'AbortError'
					? { status: 'cancelled' as const }
					: { status: 'error' as const, error }
			}
		},

		getQueryData(definition, selection) {
			const entry = existingFor$(definition, selection)
			return entry?.value$.latest()
		},
		setQueryData(definition, selection, update) {
			const entry = entryFor$(definition, selection)
			clearTimeout(entry.gcTimer)
			entry.leases++
			try {
				const previous = entry.state$.get().hasData ? entry.value$.get() : undefined
				const value = applyUpdate(update, previous)
				write(entry, value)
			} finally {
				release(entry)
			}
		},
		setQueriesData(definition, update, filter = {}) {
			assertClient()
			let count = 0
			for (const raw of [...entries.values()]) {
				if (raw.definition !== definition || !matches(raw, filter) || !raw.state$.get().hasData) {
					continue
				}

				const entry = raw as unknown as Entry<ReturnType<typeof update>>
				write(entry, update(entry.value$.get()!, entry.selection as Parameters<typeof update>[1]))
				count++
			}
			return count
		},

		invalidateQueries(filter = {}) {
			assertClient()
			for (const entry of entries.values()) {
				if (matches(entry, filter)) {
					entry.invalidated = true
					entry.invalidationVersion++
					entry.wake?.()
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
						removals.push(purgeRecord(target))
					}
				}
			}
			detachWhenIdle()
			return Promise.all(removals).then(() => {})
		},
		dispose(disposal = {}) {
			disposed = true
			environmentGeneration++
			const failures: unknown[] = []
			try {
				unsubscribe?.()
			} catch (error) {
				failures.push(error)
			}
			unsubscribe = undefined
			for (const entry of [...entries.values()]) {
				try {
					retire(entry)
				} catch (error) {
					failures.push(error)
				}
			}
			definitions.clear()
			const purges = disposal.purgePersisted
				? [...persistence.values()].map((target) => purgeNamespace(target))
				: []
			return Promise.allSettled(purges).then((results) => {
				for (const result of results) {
					if (result.status === 'rejected') {
						failures.push(result.reason)
					}
				}
				if (failures.length === 1) {
					throw failures[0]
				}
				if (failures.length) {
					throw new AggregateError(failures, 'Query client disposal failed')
				}
			})
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
