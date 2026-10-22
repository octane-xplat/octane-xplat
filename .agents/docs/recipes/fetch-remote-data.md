# Fetch remote data in a screen

ID: fetch-remote-data
Targets: web, ios, android
Related APIs: query$, signal$, derived$, skip, octane/signals, octane/signals/client, @try, @pending, @catch, useStore, refetch, retry, reset, snapshot, latest, optimistic$, action$, defineQuery, useQuery$, createQueryClient, QueryClient, invalidateQueries, evictQueries, dispose, platformQueryStorage, QueryStorageAdapter

## Starting point

A working scaffolded app with an HTTP endpoint or client function to call.
The reader can build a basic shared screen. Server-side API design and the
Rouzer route tree are outside this recipe's scope.

## Requirements

- Load remote data with visible pending and failure states on every target.
- Re-run the request when its inputs change; pause it when inputs are absent.
- Refresh or retry on demand without losing the data on screen.
- Apply writes and reconcile them with cached query data.
- Share query results across screens and reconcile writes through keyed invalidation.
- Work inside modals, sheets, and list cells where context cannot cross.

## Acceptance criteria

- AC1: The reader can declare a module-level `query$` whose request re-runs when a driving signal changes and can be paused by returning `skip`.
- AC2: The reader can render pending, error, and ready states portably, including first-read suspend under `@try`/`@pending`/`@catch`, retrying a caught request, and retaining the committed body when an explicit reset re-suspends it.
- AC3: The reader can trigger refresh/retry/reset and distinguish a background refetch via `snapshot().refreshing`.
- AC4: The reader can perform a mutation and update the visible data — imperatively via `refetch()` or optimistically via `action$`/`optimistic$`.
- AC5: The reader knows the native footguns: `$`-suffix naming, the per-module `octane/signals` runtime import, `useStore` for non-signal state, and that module-level queries avoid the cross-root context limit.
- AC6: The reader can choose between a module-level and a screen-owned `query$` for route-param-driven data, and knows the stacked-navigation hazard of copying route params into shared selector signals during render.
- AC7: The reader can pass cancellation to the transport, rely on unmount retiring component-owned requests and subscriptions, and prevent an obsolete response from replacing a later selection.
- AC8: The reader can share a query's result across screens through one `QueryClient`, isolate same-key entries and invalidation in another client, reuse definitions without merging independent selectors, and persist records with version, millisecond `maxAgeMs`, and an immutable client namespace. Dispose and replace clients when switching accounts; retired fetches/restores cannot repopulate disposed data, and a newer invalidation survives an older in-flight response. Millisecond stale windows use `staleTimeMs`.
- AC17: Development inspection reports live state and bounded metadata events without query keys, selections, data, account scopes or error messages. CLI invocation binds the exact app instance and unsupported transports are explicit.
- AC16: Shared cursor feeds deduplicate page requests, retain earlier rows on page failure, serialize refresh with page loading, bound retained pages, and restore coherent page parameters without replacing independent local collection stores.
- AC15: Shared optimistic edits compose native Octane operations, keep tentative values out of durable data, hold operation leases, preserve newer confirmed authority across overlapping settlement, and fence late account receipts. Uncertain outcomes remain explicit.
- AC14: Navigation can prepare shared records without a component owner, distinguish prefetch outcomes, and cancel its own operation without aborting requests another reader still needs.
- AC13: Typed confirmed writes update all readers and durable data, reject obsolete fetch/restore results, preserve the definition's result type, and limit bulk updates to explicitly matched existing entries.
- AC12: Stale observed queries refresh on resume/reconnect, optional polling pauses offline/background without catch-up bursts, and hosts expose unavailable lifecycle/connectivity capabilities explicitly.
- AC11: Shared reads recover through one bounded retry sequence, expose offline pause separately from usable data, support application retry policies and non-network loaders, and cancel pending delays on disposal.
- AC10: The reader can set freshness separately from inactive retention, knows when the final reader cancels work, and can restore durable records after memory collection without leaking a previous account.
- AC9: A paged collection preserves surviving selection through sort, reload, and pagination; a failed next page can retry its cursor while retaining earlier rows. Completion promises resolve and errors remain observable in state.

## Documentation

- AC1: [The shape](../../../docs/app/data.md#the-shape).
- AC2: [Reading in a screen](../../../docs/app/data.md#reading-in-a-screen).
- AC3: [Reading in a screen](../../../docs/app/data.md#reading-in-a-screen), [maintained controls](../../../packages/app/src/data-probe.tsrx), and [lifecycle trace](../../../packages/app/src/data-trace.ts).
- AC4: [Writes](../../../docs/app/data.md#writes).
- AC5: [Rules that bite on native](../../../docs/app/data.md#rules-that-bite-on-native).
- AC6: [Module scope vs screen scope](../../../docs/app/data.md#module-scope-vs-screen-scope).
- AC7: [Module scope vs screen scope](../../../docs/app/data.md#module-scope-vs-screen-scope), [maintained data probe](../../../packages/app/src/data-probe.tsrx), and [lifecycle regression trace](../../../packages/app/src/data-trace.ts).
- AC8: [The shared query cache](../../../docs/app/data.md#the-shared-query-cache) and [UI API migrations](../../../docs/app/ui-api-migrations.md#explicit-units).
- AC9: [Paged collections](../../../docs/app/data.md#paged-collections-and-tree-moves) and [maintained lifecycle regressions](../../../packages/ui/src/async-list.test.ts).

- AC10: [Keeping inactive data](../../../docs/app/data.md#keeping-inactive-data) and [query lifetime regressions](../../../packages/ui/src/query-cache.test.ts).

- AC11: [Recovering failed reads](../../../docs/app/data.md#recovering-failed-reads) and [scheduler regressions](../../../packages/ui/src/query-cache.test.ts).

- AC12: [Recovering failed reads](../../../docs/app/data.md#recovering-failed-reads), [scheduler regressions](../../../packages/ui/src/query-cache.test.ts), and [platform environment leaves](../../../packages/platform/src/environment.ts).

- AC13: [Refresh and writes](../../../docs/app/data.md#refresh-and-writes), [cache update regressions](../../../packages/ui/src/query-cache.test.ts), and [packed type contracts](../../../packages/ui/tests/packed-consumer.mjs).

- AC14: [Preparing the next screen](../../../docs/app/data.md#preparing-the-next-screen), [prepared-user route](../../../packages/app/src/app/cached-user.tsrx), and [operation regressions](../../../packages/ui/src/query-cache.test.ts).

- AC15: [Shared optimistic edits](../../../docs/app/data.md#shared-optimistic-edits) and [action regressions](../../../packages/ui/src/query-cache.test.ts).

- AC16: [Shared cursor feeds](../../../docs/app/data.md#shared-cursor-feeds), [pagination regressions](../../../packages/ui/src/query-cache.test.ts), and [native reader fixture](../../../packages/ui/tests/query-cache.fixture.mobile.tsrx).

- AC17: [Inspecting a development cache](../../../docs/app/data.md#inspecting-a-development-cache) and [inspection regressions](../../../packages/ui/src/query-inspection.test.ts).
