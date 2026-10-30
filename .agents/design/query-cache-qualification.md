# Verify the shared query cache

Use these maintained checks for the [ownership contract](query-cache-engine.md).
Record target, reviewed revision, result, and remaining gaps in Silo/local
reports. This guide defines the evidence each check can establish.

## Maintained checks

Run these commands from the repository root. The browser tasks use an already
installed Chromium binary in headless mode. They do not install browsers or
capture screenshots, and remain outside the lightweight PR test gate.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui --concurrency=1 -- query-cache.test query-inspection.test --maxWorkers=1
pnpm exec turbo run test --filter=@xplat/web --concurrency=1 -- shared-query-workflow --maxWorkers=1
pnpm exec turbo run test:query-cache-runtime --filter=// --concurrency=1
pnpm exec turbo run test:query-cache-runtime --filter=@xplat/web --concurrency=1
```

| Check | What it establishes | Boundary |
| --- | --- | --- |
| Cache and inspection unit tests | Cancellation, retry scheduling, injected lifecycle events, typed writes, optimistic settlement, pagination, persistence ordering, bounded metadata | jsdom; injected events do not qualify OS integration |
| Shared workflow component tests | Prepared independent list/detail roots, successful edits, rollback, pagination, account isolation, confirmed restoration | jsdom; routing is replaced for this component check |
| Shared cache browser fixture | Shared reader lifetime, concurrent authority, persisted page windows, account fencing, collection of 1,000 inactive entries, bounded history | Chromium, synthetic transport and handler dispatch |
| Application browser journey | Real router, prepared detail, edit success/failure, list restoration, page reload, account replacement, browser offline/online recovery, exact-instance CLI inspection | Headless Chromium with synthetic records; no production HTTP server |
| Packed consumers | Public imports, inferred selection/result/write types, development collector excluded from production output | Bundler/NodeNext compile and build evidence for web/native/macOS, not device execution |

Both runtime tasks disable Turbo caching. The root task accepts no target
arguments, so it cannot start a device or a desktop app. The application task
loads only the two maintained query screens, starts its own Vite server and
browser context, closes both, and selects the
inspection action by the app instance ID and registry revision.


## Evidence boundaries

Native object-driver and platform adapter tests do not establish actual OS
foreground/background, connectivity, storage, or input behavior. Browser
reconnect checks use browser offline/online events; native connectivity and OS
activity recovery require their own checks. Workspace entrypoint runtime checks
and packed-consumer compilation do not establish an installed-tarball journey.

Feature scope excludes durable offline mutation replay, SSR hydration transfer,
cross-tab synchronization, implicit entity normalization, and a visual cache
panel. The [public comparison](../../docs/app/data.md#tanstack-query-as-an-opt-in)
explains when another cache fits.

Historical results are indexed by `local_artifacts` key
`.agents/design/query-cache-qualification.md`; use
[operational evidence](../docs/exploration.md#operational-evidence) for lookup.
