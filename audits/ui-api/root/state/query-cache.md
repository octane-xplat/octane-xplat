# cachedQuery$ and query storage

Current exports: `cachedQuery$`, `invalidateQueries`, `clearQueryCache`, `createMemoryQueryStorage`, `platformQueryStorage`.

**Design: Keep the signal suffix and document both key roles and cache ownership.**

cachedQuery$ has a cache QueryKey and an optional options.key for signal identity. Those different keys are easy to confuse. Name them cacheKey and signalKey, specify whether invalidation matches prefixes, and keep request/account ownership distinct from persistent storage scope. Preserve Octane query semantics rather than implying a React query-hook lifecycle.

Proposed shape (illustrative):

```ts
type ProposedQueryIdentity<Key> = {
	cacheKey: Key
	signalKey?: string
	owner: 'request' | 'account' | 'app'
}
```

**Design: State persistence units and make storage failures observable.**

staleTime and maxAge lack units in their names, and storage get/set/remove may be synchronous or asynchronous. Use staleTimeMs/maxAgeMs and an explicit persistence error callback/result. Keep schema version and account scoping first-class so generated invalidation and sign-out logic have a concrete contract.

Proposed shape (illustrative):

```ts
type ProposedPersistenceOptions = {
	version: string | number
	maxAgeMs?: number
	onError?: (error: unknown) => void
}
```

Evidence: [src/query-cache.ts:55](../../../../packages/ui/src/query-cache.ts#L55), [src/query-cache.ts:542](../../../../packages/ui/src/query-cache.ts#L542).

[Audit index](../../README.md)
