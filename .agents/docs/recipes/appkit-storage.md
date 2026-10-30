# Save ordinary AppKit settings and purge saved query snapshots

ID: appkit-storage
Targets: macos
Related APIs: storage, platformQueryStorage, QueryStorageAdapter, QueryClient

## Starting point

An app with the native AppKit host saves non-secret preferences, bounded drafts
and completed query JSON. Localization's app-locale example and the maintained
query workflows establish demand. Prefer NSUserDefaults through the existing
host hooks; add no dependencies. Ordinary settings and refetchable query cache
need different fallback policies. Source models are not native persistence proof.

## Acceptance criteria

- AC1: Keep ordinary settings immediately readable across missing set/remove hooks, preserve removal tombstones, adopt explicit pre-host mutations once a host appears, isolate previous-host state, treat native misses as authoritative for acknowledged mirrors and preserve method receivers. Reads must not replay writes. Missing handoff keeps flush false; synchronous writer-only hosts still confirm handoff. Preserve intent on native failure and newer reentrant writes during a bounded flush.
- AC2: Own the lazy inactive subscription by current host and hook identities, invalidate before cleanup, tolerate failed cleanup/registration, retry on later writes and keep retired callbacks from flushing a replacement host. Handle synchronous registration events, inactive writes and native flush failure without recursive replay. Explicit flush failures remain observable.
- AC3: Use native query persistence only with a complete get/set/remove bridge. Keep partial/pre-host cache isolated, never revive its stale entries after native misses/host loss or promote them into a native store. Keep query restore/set best effort while explicit purge propagates native read/removal failure or an incomplete/lost previously observed bridge. Preserve hook receivers and attempt available partial-host removal hooks while rejecting incomplete namespace-purge confirmation.
- AC4: Provide manual Save/Read/Remove/Flush controls in native Services and an idle-only probe using one bounded non-secret demo key. Reconcile public service/data guidance, package README and Octane skill; distinguish handoff from crash durability. Record exact deferred commands and source-only evidence; keep runtime qualification checkboxes open.

## Documentation

- AC1–AC2: [AppKit settings](../../../docs/platform/platform-services.md#appkit-settings), [platform README](../../../packages/platform/README.md), [storage leaf](../../../packages/platform/src/storage.macos.ts), [host contract](../../../packages/platform/src/appkit-host.ts) and [storage models](../../../packages/platform/tests/storage.test.mjs). Eight additional source-model cases are authored, all unrun. Existing writer-only and lazy-subscription expectations remain in place.
- AC3: [Persistence guide](../../../docs/app/data.md#persisting-records), [query adapter](../../../packages/ui/src/data/query-storage.macos.ts) and [query adapter models](../../../packages/ui/tests/query-storage.macos.test.mjs). Five additional cases and a revised failed-purge case are authored, all unrun. Query-cache purge source already propagates adapter removal failures; no shared engine changes.
- AC4: [Manual controls](../../../packages/app/src/Storage.macos.tsrx), [Services integration](../../../packages/app/src/Services.macos.tsrx), [idle probe](../../../examples/probes/storage.macos.tsrx), [skill guidance](../../skills/octane-xplat/references/services.md#storage--keyvalue) and [target note](../exploration.md#operational-evidence). All authored checks, native NSUserDefaults/restart/lifecycle/input/AX/memory and installed consumers remain unrun/unqualified. The probe's run function waits only for mounting and never presses a button.
