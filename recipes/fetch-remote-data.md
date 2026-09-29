# Fetch remote data in a screen

ID: fetch-remote-data
Targets: web, ios, android
Related APIs: query$, signal$, derived$, skip, octane/signals, octane/signals/client, @try, @pending, @catch, useStore, refetch, retry, reset, snapshot, latest, optimistic$, action$

## Starting point

A working scaffolded app with an HTTP endpoint or client function to call.
The reader can build a basic shared screen. Server-side API design and the
Rouzer route tree are outside this recipe's scope.

## Requirements

- Load remote data with visible pending and failure states on every target.
- Re-run the request when its inputs change; pause it when inputs are absent.
- Refresh or retry on demand without losing the data on screen.
- Apply writes and reconcile them with cached query data.
- Work inside modals, sheets, and list cells where context cannot cross.

## Acceptance criteria

- AC1: The reader can declare a module-level `query$` whose request re-runs when a driving signal changes and can be paused by returning `skip`.
- AC2: The reader can render pending, error, and ready states portably, including a first-read suspend under `@try`/`@pending`/`@catch` and the native rule that a committed boundary must not re-suspend.
- AC3: The reader can trigger refresh/retry/reset and distinguish a background refetch via `snapshot().refreshing`.
- AC4: The reader can perform a mutation and update the visible data — imperatively via `refetch()` or optimistically via `action$`/`optimistic$`.
- AC5: The reader knows the native footguns: `$`-suffix naming, the per-module `octane/signals` runtime import, `useStore` for non-signal state, and that module-level queries avoid the cross-root context limit.
- AC6: The reader can choose between a module-level and a screen-owned `query$` for route-param-driven data, and knows the stacked-navigation hazard of copying route params into shared selector signals during render.

## Documentation

- AC1: [The shape](../docs/data.md#the-shape).
- AC2: [Reading in a screen](../docs/data.md#reading-in-a-screen).
- AC3: [Reading in a screen](../docs/data.md#reading-in-a-screen) — read-call table. Gap: The native committed-boundary rule is documented, but a safe reset/re-pending workflow needs an example.
- AC4: [Writes](../docs/data.md#writes).
- AC5: [Rules that bite on native](../docs/data.md#rules-that-bite-on-native).
- AC6: [Module scope vs screen scope](../docs/data.md#module-scope-vs-screen-scope).
