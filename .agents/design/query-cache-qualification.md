# Shared query cache qualification

This is the validation record for [the query cache plan](query-cache-plan.md).
The current qualification scope is headless tests, as requested on 2026-10-23.
Device runs, desktop application launches, and OS lifecycle qualification are
deferred. Earlier isolated native experiments remain in the
[engine decision](query-cache-engine.md); they do not establish parity for the
composed application workflow.

## Verified results

On 2026-10-23, the focused cache/inspection suite passed 67 tests and the
composed component suite passed two tests. The UI/app dependent typecheck
passed all 53 tasks with concurrency 1, including the focused browser fixture.
The docs build passed 27 tasks; recipe links, purpose barrels, and root script
types also passed. The headless application journey passed all 11 assertions,
including exact-instance CLI inspection and browser offline/online recovery.
The small Chromium cache fixture passed 20 assertions, including shared
reader leases, concurrent receipts, persistence and collection of 1,000 entries.

The first application browser attempt loaded the full demo harness and was
interrupted during a compiler metadata error in an unrelated context-menu
module. The maintained check now imports only the two query screens. Its
first focused attempt exposed a missing explicit CLI app selection; the test
now uses `--app apps/web` and the bridge's `appRoot` option, without changing
saved user preferences. The corrected focused task passed and exited cleanly.

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

## Remaining evidence gaps

The composed application has no current iOS, Android, macOS, Linux, or Windows
runtime qualification. Native object-driver and platform adapter tests check
contracts without establishing OS foreground/background, connectivity, storage,
or input behavior. Browser reconnect checks use browser offline/online events;
actual native connectivity transitions and OS activity recovery remain deferred.
The runtime fixture resolves workspace public entrypoints; packed-consumer
compilation is separate evidence, not an installed-tarball runtime journey.

The feature scope still excludes durable offline mutation replay, SSR
hydration transfer, cross-tab synchronization, implicit entity normalization,
and a visual cache panel. The [public comparison](../../docs/app/data.md#tanstack-query-as-an-opt-in)
keeps these reasons to choose another cache visible.
