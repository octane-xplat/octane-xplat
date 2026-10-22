/**
 * Shared keyed cache over `octane/signals` `query$`.
 *
 * `query$` scopes a request to its declaring owner: a module-level query is
 * one root cell, a component-level query is one instance cell. There is
 * no cross-owner dedupe, no cross-screen invalidation, and no persistence.
 * This module adds the app-facing cache contract on top, without changing the
 * primitive:
 *
 * - `cachedQuery$(key, select, load, options)` declares a query whose results
 *   live in the default app-wide cache keyed by `[...key, selection]`. Two
 *   screens (or two query declarations) that resolve the same cache key share
 *   the cached value and dedupe an in-flight request.
 * - `createQueryClient()` creates an independent cache for an app or data
 *   consumer that must not share entries or invalidation with the default
 *   client or another client.
 * - `invalidateQueries(key)` marks matching entries stale and refetches the
 *   owning queries in every live scope — same-identity retries, so each
 *   screen keeps its previous data while it refreshes.
 * - `clearQueryCache(key?)` evicts entries (and persisted records) without
 *   refetching — for sign-out and schema bumps.
 * - `persist` opts a query into durable snapshots through a pluggable
 *   `QueryStorageAdapter` (`platformQueryStorage`, or an app adapter such as
 *   idb-keyval on web). The envelope carries a compatibility `version`, the
 *   Unix-millisecond save time for `maxAgeMs`/`staleTimeMs` policies, and an app-resolved `scope`
 *   (e.g. the auth boundary) — the app owns the policy, the cache owns the
 *   mechanics.
 *
 * Mutations stay app-owned async functions: await the write, then call
 * `invalidateQueries`. There is deliberately no `mutation$` here.
 *
 * Identity model: the octane request identity stays `[query, selection]`, so
 * invalidation refetches keep `previous` and stay stale-while-revalidate.
 * The cache key adds the family `key` prefix so prefix invalidation and
 * persistence namespacing are expressible. Canonicalization sorts object
 * fields — `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` are one cache entry even
 * though octane request identity is positional.
 *
 * Requires the patched `octane` used by xplat apps: instance-scoped
 * descriptors bind their declaring owner at construction, which is what lets
 * `invalidateQueries` reach a screen-owned query from module code.
 */
import {
	query$,
	ScopeDisposedError,
	skip,
	SIGNAL_BINDING_IDENTITY,
	SIGNAL_BINDING_READ,
	SIGNAL_BINDING_SUBSCRIBE,
	SIGNAL_HANDLE,
	type QueryContext,
	type QuerySignal,
	type SignalBindingIdentity,
	type SignalSnapshot,
} from 'octane/signals'

/** One JSON-canonical element of a `QueryKey`. */
export type QueryKeyPart =
	| string
	| number
	| boolean
	| null
	| readonly QueryKeyPart[]
	| { readonly [field: string]: QueryKeyPart | undefined }

/**
 * A query-family key. Family keys prefix the cache key; the selector's
 * selection is appended, so `['user']` covers `['user', '42']` and
 * `invalidateQueries(['user'])` reaches every selection of that family.
 */
export type QueryKey = readonly QueryKeyPart[]

/**
 * Persistence adapter for the query cache — `get`/`set`/`remove` so cached queries survive reloads.
 */
export interface QueryStorageAdapter {
	get(key: string): string | null | undefined | PromiseLike<string | null | undefined>
	set(key: string, value: string): void | PromiseLike<void>
	remove(key: string): void | PromiseLike<void>
}

/**
 * Opt-in durable snapshots for one `cachedQuery$` family. The envelope is
 * `{ v: version, t: savedAtMs, d: data }` under storage key
 * `xplat:query:<scope>:<canonical key>`. Apps layer their policy on top:
 * `version` is the schema/app/API compatibility bump, `maxAgeMs` the TTL, and
 * `scope` the resolved auth boundary (return `null` to leave the query
 * memory-only for that boundary).
 */
export interface QueryPersistence {
	readonly storage: QueryStorageAdapter
	readonly version: string | number
	/** Milliseconds a stored snapshot stays restorable. Default: no expiry. */
	readonly maxAgeMs?: number
	/** Captured for each cache entry; clear entries before changing the boundary. */
	readonly scope?: () => string | null
}

/**
 * Options for a cached query — key identity, millisecond freshness duration,
 * persistence adapter, and stale policy.
 */
export interface CachedQueryOptions<T = unknown> {
	/**
	 * Milliseconds a cache entry stays fresh — new readers are served without
	 * a request. Default `0`: mounting or selecting a stale entry serves the
	 * cached value and revalidates in the background.
	 */
	readonly staleTimeMs?: number
	readonly persist?: QueryPersistence
	/**
	 * Distinguishes same-family declarations inside one scope. Without it,
	 * every `cachedQuery$` in a scope that shares the family also shares one
	 * query cell (first selector/loader wins). Rarely needed — different
	 * families never collide.
	 */
	readonly key?: string
}

/** Independent in-memory cache scope for cached query declarations. */
export interface QueryClient {
	cachedQuery$<A, T>(
		key: QueryKey,
		select: () => A | typeof skip,
		load: (selection: A, context: QueryContext<T>) => T | PromiseLike<T>,
		options?: CachedQueryOptions<T>,
	): CachedQuery<T>
	invalidateQueries(key?: QueryKey, options?: InvalidateQueriesOptions): void
	clearQueryCache(key?: QueryKey, options?: ClearQueryCacheOptions): void
}

interface CacheEntry<T = unknown> {
	readonly elements: readonly string[]
	value: T | undefined
	hasValue: boolean
	fetchedAtMs: number
	invalidated: boolean
	invalidationVersion: number
	revision: number
	retired: boolean
	inflight: Promise<T> | undefined
	controller: AbortController | undefined
	persistChecked: boolean
	restoring: Promise<void> | undefined
	persist: PersistenceTarget | undefined
}

interface PersistenceTarget {
	readonly storage: QueryStorageAdapter
	readonly key: string
	readonly version: string | number
	readonly maxAgeMs: number | undefined
}

interface CacheFamily {
	readonly elements: readonly string[]
	/**
	 * Registered queries keyed by node key + declaring owner identity. A
	 * component re-declares its cached queries on every render; keying by
	 * owner keeps the registration stable so fan-out retries each live owner
	 * once. `state` outlives any single declaration — the cell keeps the first
	 * render's selector/loader, so fan-out state writes must land on a shared
	 * record, not on whichever facade was declared last.
	 */
	readonly queries: Map<
		string,
		{
			facade: CachedQuerySignal<unknown>
			state: CachedQueryState<unknown>
		}
	>
}

interface QueryCacheStore {
	readonly id: number
	readonly families: Map<string, CacheFamily>
	readonly entries: Map<string, CacheEntry>
}

/**
 * Per-declaration bookkeeping shared between the query wrapper and its
 * facade: the cache key of the last evaluated selection and the request
 * that evaluation started (or joined), which is what the awaitable verbs
 * resolve on.
 */
interface CachedQueryState<T> {
	lastElements: readonly string[] | undefined
	lastRequest: PromiseLike<T> | undefined
}

/** Deterministic JSON encoding: sorted object fields, JSON scalar rules. */
function canonicalize(value: unknown): string {
	if (value === undefined || value === null) {
		return 'null'
	}

	switch (typeof value) {
		case 'boolean':
		case 'string':
			return JSON.stringify(value)
		case 'number':
			return Number.isFinite(value) ? JSON.stringify(value) : 'null'
		case 'object': {
			if (Array.isArray(value)) {
				return `[${value.map(canonicalize).join(',')}]`
			}

			const prototype = Object.getPrototypeOf(value)
			if (prototype !== null && prototype !== Object.prototype) {
				throw new TypeError('query cache keys and selections must be JSON-serializable')
			}

			const fields = Object.keys(value as Record<string, unknown>).sort()
			return `{${fields
				.filter((field) => (value as Record<string, unknown>)[field] !== undefined)
				.map(
					(field) =>
						`${JSON.stringify(field)}:${canonicalize((value as Record<string, unknown>)[field])}`,
				)
				.join(',')}}`
		}
		default:
			throw new TypeError('query cache keys and selections must be JSON-serializable')
	}
}

const SEPARATOR = '\u0001'

function elementsOf(key: QueryKey): readonly string[] {
	return key.map(canonicalize)
}

function keyString(elements: readonly string[]): string {
	return elements.join(SEPARATOR)
}

function isPrefix(prefix: readonly string[], elements: readonly string[]): boolean {
	if (prefix.length > elements.length) {
		return false
	}

	for (let i = 0; i < prefix.length; i++) {
		if (prefix[i] !== elements[i]) {
			return false
		}
	}

	return true
}

function elementsEqual(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && isPrefix(a, b)
}

let nextQueryCacheId = 0

function familyFor(cache: QueryCacheStore, key: QueryKey): CacheFamily {
	const elements = elementsOf(key)
	if (elements.length === 0) {
		throw new TypeError('cachedQuery$ requires a non-empty key')
	}

	const id = keyString(elements)
	let family = cache.families.get(id)
	if (family === undefined) {
		family = { elements, queries: new Map() }
		cache.families.set(id, family)
	}

	return family
}

function entryFor<T>(
	cache: QueryCacheStore,
	elements: readonly string[],
	persist: QueryPersistence | undefined,
): CacheEntry<T> {
	const id = keyString(elements)
	let entry = cache.entries.get(id) as CacheEntry<T> | undefined
	if (entry === undefined) {
		entry = {
			elements,
			value: undefined,
			hasValue: false,
			fetchedAtMs: 0,
			invalidated: false,
			invalidationVersion: 0,
			revision: 0,
			retired: false,
			inflight: undefined,
			controller: undefined,
			persistChecked: false,
			restoring: undefined,
			persist: persistenceTarget(elements, persist),
		}

		cache.entries.set(id, entry)
	} else if (persist !== undefined && entry.persist === undefined) {
		entry.persist = persistenceTarget(elements, persist)
	}

	return entry
}

function matchingElements(key: QueryKey | undefined, exact: boolean) {
	if (key === undefined) {
		return () => true
	}

	const elements = elementsOf(key)
	return (candidate: readonly string[]) =>
		exact
			? candidate.length === elements.length && isPrefix(elements, candidate)
			: isPrefix(elements, candidate)
}

/**
 * `retry()` evaluates and starts the loader synchronously, so the load mode is
 * a scoped flag rather than a passed option:
 * - `forced` bypasses freshness and always fetches (explicit refetch/retry).
 * - `serve` answers from the entry when it has a value without fetching or
 *   kicking a revalidation (cache republish after a fetch settles).
 * - unset = `normal` (octane-driven loads): fresh entries serve, stale entries
 *   serve their value and revalidate in the background, misses fetch.
 */
type LoadMode = 'normal' | 'forced' | 'serve'
let loadMode: LoadMode = 'normal'

function withLoadMode<T>(mode: LoadMode, run: () => T): T {
	const previous = loadMode
	loadMode = mode
	try {
		return run()
	} finally {
		loadMode = previous
	}
}

/**
 * Retry every registered cached query whose last-selected cache key matches,
 * in `normal` mode so entry staleness decides whether each one fetches.
 * Queries that never loaded a selection are skipped — a fan-out must not wake
 * unevaluated cells into requests nobody made. A disposed declaration owner
 * is unregistered; other failures land on the query cell's own error state
 * and must not stop the fan-out.
 */
function republish(
	cache: QueryCacheStore,
	mode: 'normal' | 'serve',
	matches: (elements: readonly string[]) => boolean,
): void {
	for (const family of cache.families.values()) {
		for (const [registration, query] of [...family.queries]) {
			const selected = query.state.lastElements
			if (selected === undefined || !matches(selected)) {
				continue
			}

			try {
				withLoadMode(mode, () => query.facade.republishRetry())
			} catch (error) {
				if (error instanceof ScopeDisposedError) {
					family.queries.delete(registration)
				}
			}
		}
	}
}

function persistenceTarget(
	elements: readonly string[],
	persist: QueryPersistence | undefined,
): PersistenceTarget | undefined {
	if (persist === undefined) return
	try {
		const scope = persist.scope?.() ?? null
		if (scope === null) return
		return {
			storage: persist.storage,
			key: `xplat:query:${scope}:${keyString(elements)}`,
			version: persist.version,
			maxAgeMs: persist.maxAgeMs,
		}
	} catch {
		// Persistence is best-effort, including app-provided scope resolution.
	}
}

// Shared across clients using the same adapter: a clear must follow any save
// already in progress, and a new reader must wait for that removal.
const storageTails = new WeakMap<QueryStorageAdapter, Map<string, Promise<void>>>()

function storageOperation<T>(target: PersistenceTarget, run: () => T | PromiseLike<T>): Promise<T> {
	let tails = storageTails.get(target.storage)
	if (tails === undefined) storageTails.set(target.storage, (tails = new Map()))
	const result = (tails.get(target.key) ?? Promise.resolve()).then(run)
	const tail = result.then(() => {}, () => {})
	tails.set(target.key, tail)
	void tail.then(() => {
		if (tails.get(target.key) === tail) tails.delete(target.key)
	})
	return result
}

function persistWrite(entry: CacheEntry): void {
	const target = entry.persist
	if (target === undefined || !entry.hasValue || entry.retired) return
	try {
		const envelope = JSON.stringify({ v: target.version, t: entry.fetchedAtMs, d: entry.value })
		void storageOperation(target, () => target.storage.set(target.key, envelope)).catch(() => {})
	} catch {
		// Non-serializable data must not break the in-memory query.
	}
}

async function restoreEntry<T>(entry: CacheEntry<T>): Promise<void> {
	entry.persistChecked = true
	const target = entry.persist
	if (target === undefined) return
	const revision = entry.revision
	try {
		const raw = await storageOperation(target, () => target.storage.get(target.key))
		if (entry.retired || entry.revision !== revision || raw == null) return
		try {
			const envelope = JSON.parse(raw)
			if (
				envelope === null ||
				typeof envelope !== 'object' ||
				envelope.v !== target.version ||
				typeof envelope.t !== 'number' ||
				!Number.isFinite(envelope.t) ||
				(target.maxAgeMs !== undefined && Date.now() - envelope.t > target.maxAgeMs)
			) {
				throw new Error('stale envelope')
			}
			entry.value = envelope.d as T
			entry.hasValue = true
			entry.fetchedAtMs = envelope.t
		} catch {
			await storageOperation(target, () => target.storage.remove(target.key))
		}
	} catch {
		// Persistence is best-effort.
	}
}

function removePersisted(entry: CacheEntry): void {
	const target = entry.persist
	if (target !== undefined) {
		void storageOperation(target, () => target.storage.remove(target.key)).catch(() => {})
	}
}

function assertActive(entry: CacheEntry): void {
	if (entry.retired) {
		const error = new Error('Query cache entry was cleared')
		error.name = 'AbortError'
		throw error
	}
}

function startFetch<A, T>(
	cache: QueryCacheStore,
	entry: CacheEntry<T>,
	selection: A,
	load: (selection: A, context: QueryContext<T>) => T | PromiseLike<T>,
	previous: T | undefined,
): Promise<T> {
	assertActive(entry)
	if (entry.inflight !== undefined) {
		return entry.inflight
	}

	const invalidationVersion = entry.invalidationVersion
	entry.revision++
	const controller = new AbortController()
	entry.controller = controller
	const context: QueryContext<T> =
		previous === undefined ? { signal: controller.signal } : { signal: controller.signal, previous }

	const followUp = (): Promise<T> | undefined => {
		assertActive(entry)
		if (entry.invalidationVersion !== invalidationVersion) {
			entry.inflight = undefined
			return startFetch(cache, entry, selection, load, previous)
		}
	}
	const request: Promise<T> = Promise.resolve().then(() => {
		assertActive(entry)
		return load(selection, context)
	}).then(
		(value) => followUp() ?? value,
		(error) => {
			const next = followUp()
			if (next !== undefined) return next
			throw error
		},
	)
	entry.inflight = request
	request.then(
		(value) => {
			if (entry.retired || entry.inflight !== request) {
				return
			}

			entry.inflight = undefined
			entry.controller = undefined
			entry.value = value
			entry.hasValue = true
			entry.invalidated = false
			entry.fetchedAtMs = Date.now()
			persistWrite(entry)
			republish(cache, 'serve', (elements) => elementsEqual(elements, entry.elements))
		},
		() => {
			if (entry.retired || entry.inflight !== request) {
				return
			}

			entry.inflight = undefined
			entry.controller = undefined
		},
	)

	return request
}

function loadThroughCache<A, T>(
	cache: QueryCacheStore,
	elements: readonly string[],
	options: CachedQueryOptions<T> | undefined,
	load: (selection: A, context: QueryContext<T>) => T | PromiseLike<T>,
	selection: A,
	context: QueryContext<T>,
): T | PromiseLike<T> {
	const entry = entryFor<T>(cache, elements, options?.persist)
	const staleTimeMs = options?.staleTimeMs ?? 0
	const mode = loadMode

	if (entry.inflight !== undefined) {
		return entry.inflight
	}

	if (entry.hasValue) {
		if (mode === 'serve') {
			return entry.value!
		}

		const timeStale =
			staleTimeMs !== Number.POSITIVE_INFINITY && Date.now() - entry.fetchedAtMs >= staleTimeMs

		const stale = entry.invalidated || timeStale
		if (!stale && mode !== 'forced') {
			return entry.value!
		}

		if (mode === 'forced' || context.previous !== undefined) {
			return startFetch(cache, entry, selection, load, context.previous ?? entry.value)
		}

		// Normal mode on a fresh mount: serve the stale value now and let the
		// background fetch republish the update when it lands.
		void startFetch(cache, entry, selection, load, entry.value).catch(() => {})
		return entry.value!
	}

	if (mode !== 'forced' && entry.persist !== undefined && (!entry.persistChecked || entry.restoring !== undefined)) {
		entry.restoring ??= restoreEntry(entry).finally(() => { entry.restoring = undefined })
		return (async () => {
			await entry.restoring
			assertActive(entry)
			if (entry.inflight !== undefined) return entry.inflight
			if (entry.hasValue) {
				const timeStale =
					staleTimeMs !== Number.POSITIVE_INFINITY && Date.now() - entry.fetchedAtMs >= staleTimeMs

				if (!entry.invalidated && !timeStale) {
					return entry.value!
				}

				void startFetch(cache, entry, selection, load, entry.value).catch(() => {})
				return entry.value!
			}

			return startFetch(cache, entry, selection, load, context.previous)
		})()
	}

	return startFetch(cache, entry, selection, load, context.previous)
}

/**
 * A `QuerySignal` declared by `cachedQuery$`: the same reads plus
 * awaitable refresh operations.
 *
 * `refetch()`/`retry()`/`reset()` force a fresh request and resolve when
 * that request settles — immediately when none started (a `skip`ped
 * selection, or an owner with no readers). They never reject: a failed
 * request lands on `snapshot().error`, so an unawaited call cannot produce
 * an unhandled rejection. Requests on one cache entry always dedupe — an
 * overlapping call joins the in-flight request rather than starting
 * another, and the returned promise tracks that shared request.
 *
 * Pending and error state come from `snapshot()`: `status` is `'pending'`
 * before the first value, `'error'` on failure, and `refreshing` marks a
 * background revalidation over retained data. Cancellation follows the
 * `query$` rules — a changed selection, a retired owner, or
 * `clearQueryCache` on the entry aborts the in-flight request's signal;
 * there is no per-query `cancel()` because the cell owns request lifetime.
 */
export interface CachedQuery<T> extends QuerySignal<T> {
	refetch(): Promise<void>
	retry(options?: { pending?: boolean }): Promise<void>
	reset(): Promise<void>
}

const SETTLE = (): void => {}

function asThenable<T>(value: T | PromiseLike<T>): PromiseLike<T> | undefined {
	return typeof (value as { then?: unknown }).then === 'function'
		? (value as PromiseLike<T>)
		: undefined
}

/**
 * Declare a `query$` whose results are shared through the module-level query
 * cache. Same signature shape as `query$`, plus a required family `key` that
 * gives the query a stable cross-screen identity and an invalidation target.
 *
 * The returned handle is a full `QuerySignal`: `.get()` suspends, `.latest()`
 * and `.snapshot()` read without suspending, and `.refetch()`/`.retry()`/
 * `.reset()` force a fresh request, resolving when it settles.
 *
 * The inner query uses an explicit, family-derived key so every re-render
 * declaration resolves to the same cell. Two declarations in the same scope
 * that share a family therefore also share a cell — the first selector and
 * loader bound in that scope wins, the same as declaring the same `query$`
 * twice. To keep same-family declarations distinct inside one scope, pass a
 * distinguishing `options.key`.
 */
function cachedQueryIn<A, T>(
	cache: QueryCacheStore,
	key: QueryKey,
	select: () => A | typeof skip,
	load: (selection: A, context: QueryContext<T>) => T | PromiseLike<T>,
	options?: CachedQueryOptions<T>,
): CachedQuery<T> {
	if (options !== undefined && (options as { kind?: unknown }).kind !== undefined) {
		throw new TypeError(
			'cachedQuery$ supports promise queries only; stream queries stay plain query$',
		)
	}

	const family = familyFor(cache, key)
	const state: CachedQueryState<T> = { lastElements: undefined, lastRequest: undefined }
	const handle = new CachedQuerySignal<T>()
	const inner$ = query$(
		select,
		(selection: A, context: QueryContext<T>) => {
			const elements = [...family.elements, canonicalize(selection)]
			state.lastElements = elements
			const result = loadThroughCache(cache, elements, options, load, selection, context)
			state.lastRequest = asThenable(result)

			return result
		},
		{
			key: `xplat:query-cache:${cache.id}:${keyString(family.elements)}${options?.key ? `:${options.key}` : ''}`,
		},
	)

	handle.inner$ = inner$
	handle.state = state
	const registration = registrationKey(inner$)
	const existing = family.queries.get(registration)
	if (existing === undefined) {
		family.queries.set(registration, { facade: handle as CachedQuerySignal<unknown>, state })
	} else {
		// Re-declaration: the cell keeps the first declaration's describe and
		// writes to the registered state; only the fan-out facade updates.
		existing.facade = handle as CachedQuerySignal<unknown>
	}

	return handle
}

/**
 * Create an isolated cache for one app instance or data consumer. Queries
 * declared through this client share with each other, but not with the
 * module-default `cachedQuery$` API or another client.
 */
export function createQueryClient(): QueryClient {
	const cache: QueryCacheStore = {
		id: ++nextQueryCacheId,
		families: new Map(),
		entries: new Map(),
	}

	return {
		cachedQuery$: (key, select, load, options) => cachedQueryIn(cache, key, select, load, options),
		invalidateQueries: (key, options) => invalidateQueriesIn(cache, key, options),
		clearQueryCache: (key, options) => clearQueryCacheIn(cache, key, options),
	}
}

const defaultQueryClient = createQueryClient()

/** Declare a query in the default app-wide cache. */
export function cachedQuery$<A, T>(
	key: QueryKey,
	select: () => A | typeof skip,
	load: (selection: A, context: QueryContext<T>) => T | PromiseLike<T>,
	options?: CachedQueryOptions<T>,
): CachedQuery<T> {
	return defaultQueryClient.cachedQuery$(key, select, load, options)
}

/**
 * One registration per (node key, declaring owner): a component re-declaring
 * the same cached query on every render reuses its registration, while two
 * mounted instances or two roots register side by side. The declaring
 * owner is read off the compiled descriptor's `owner` — an Octane internal —
 * with the scope key as discriminator.
 */
function registrationKey(inner$: QuerySignal<unknown>): string {
	const owner = (inner$ as { owner?: unknown }).owner
	const discriminator =
		owner !== null && typeof owner === 'object'
			? (((owner as { instanceKey?: unknown }).instanceKey ??
					(owner as { scopeKey?: unknown }).scopeKey) as string | undefined)
			: undefined

	return `${inner$.key}${discriminator ?? ''}`
}

class CachedQuerySignal<T> implements CachedQuery<T> {
	readonly [SIGNAL_HANDLE] = true as const
	readonly kind = 'async' as const
	inner$!: QuerySignal<T>
	/** @internal Set by `cachedQuery$` — shared bookkeeping with the
	 *  declaring wrapper; `lastRequest` is the request the awaitable verbs
	 *  resolve on. */
	state!: CachedQueryState<T>

	get key(): string {
		return this.inner$.key
	}

	private forced(run: () => void): void {
		withLoadMode('forced', run)
	}

	// The octane retry verbs evaluate and start the loader synchronously,
	// so the request the wrapper just recorded is this call's outcome.
	private settleAfter(run: () => void): Promise<void> {
		let request: PromiseLike<T> | undefined
		this.forced(() => {
			this.state.lastRequest = undefined
			run()
			request = this.state.lastRequest
		})

		// Settle-only: the failure lives on the query's error state — an
		// unawaited verb must not produce an unhandled rejection.
		return request === undefined ? Promise.resolve() : Promise.resolve(request).then(SETTLE, SETTLE)
	}

	/** @internal Fan-out retries inherit the republish mode instead of forcing. */
	republishRetry(): void {
		this.inner$.retry()
	}

	get(): T {
		return this.inner$.get()
	}

	latest(): T | undefined
	latest<F>(fallback: F): T | F
	latest<F>(fallback?: F): T | F | undefined {
		return this.inner$.latest(fallback as F)
	}

	snapshot(): SignalSnapshot<T> {
		return this.inner$.snapshot()
	}

	subscribe(notify: () => void): () => void {
		return this.inner$.subscribe(notify)
	}

	[SIGNAL_BINDING_READ](): T {
		return this.inner$[SIGNAL_BINDING_READ]()
	}

	[SIGNAL_BINDING_SUBSCRIBE](notify: () => void, onRetire?: () => void): () => void {
		return this.inner$[SIGNAL_BINDING_SUBSCRIBE](notify, onRetire)
	}

	[SIGNAL_BINDING_IDENTITY](): SignalBindingIdentity {
		return this.inner$[SIGNAL_BINDING_IDENTITY]()
	}

	refetch(): Promise<void> {
		return this.settleAfter(() => this.inner$.refetch())
	}

	retry(options?: { pending?: boolean }): Promise<void> {
		return this.settleAfter(() => this.inner$.retry(options))
	}

	reset(): Promise<void> {
		return this.settleAfter(() => this.inner$.reset())
	}
}

/**
 * Filter for `invalidateQueries` — key prefix/exact match.
 */
export interface InvalidateQueriesOptions {
	/** Match only the exact key; default invalidates the key's whole subtree. */
	readonly exact?: boolean
}

/**
 * Mark matching cache entries stale and refetch every live query that can own
 * them. Call with no key to invalidate the whole cache.
 *
 * Owners refetch through their own query cell, so screens keep their current
 * data while the new request runs (`snapshot().refreshing`). Entries whose
 * owners are unmounted stay stale; their next reader revalidates.
 */
export function invalidateQueries(key?: QueryKey, options?: InvalidateQueriesOptions): void {
	defaultQueryClient.invalidateQueries(key, options)
}

function invalidateQueriesIn(
	cache: QueryCacheStore,
	key?: QueryKey,
	options?: InvalidateQueriesOptions,
): void {
	const matches = matchingElements(key, options?.exact === true)
	for (const entry of cache.entries.values()) {
		if (matches(entry.elements)) {
			entry.invalidated = true
			entry.invalidationVersion++
		}
	}

	republish(cache, 'normal', matches)
}

/**
 * Filter for `clearQueryCache` — which entries to drop.
 */
export interface ClearQueryCacheOptions {
	readonly exact?: boolean
}

/**
 * Evict matching cache entries — and their persisted records — without
 * refetching. Mounted queries keep the data they already show; the next
 * reader repopulates. Call with no key to clear the whole cache (e.g. on
 * sign-out, before the auth scope changes).
 */
export function clearQueryCache(key?: QueryKey, options?: ClearQueryCacheOptions): void {
	defaultQueryClient.clearQueryCache(key, options)
}

function clearQueryCacheIn(
	cache: QueryCacheStore,
	key?: QueryKey,
	options?: ClearQueryCacheOptions,
): void {
	const matches = matchingElements(key, options?.exact === true)
	for (const entry of [...cache.entries.values()]) {
		if (!matches(entry.elements)) {
			continue
		}

		entry.retired = true
		entry.controller?.abort()
		removePersisted(entry)
		cache.entries.delete(keyString(entry.elements))
	}
}

/** Map-backed storage adapter — tests, examples, and custom persistence hosts. */
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
