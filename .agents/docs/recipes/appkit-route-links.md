# Bind incoming AppKit links to the primary root lifetime

ID: appkit-route-links
Targets: macos
Related APIs: onDeepLink, consumeInitialUrl, router.navigateUrl, useEffect

## Starting point

The private AppKit proving host imports the generated catalog before creating its
window. The native route-link installer previously subscribed at module import
and discarded navigation promises and cleanup. Standard outlet setup occurs in
layout effects; bind from the primary root effect and use existing public APIs.
No new public framework readiness API, dependency or timer loop.

## Requirements

Keep native incoming-link delivery owned by the primary root. Preserve normal
router policy, retire callbacks when their owner ends and document the remaining
native qualification boundary.

## Acceptance criteria

- AC1: Route/catalog imports have no AppKit producer side effect. The native entry owns binding in its TSX root effect, forwards existing props and returns cleanup; keep the shared wireRouteLinks export/signature without modifying other-target startup or generated catalogs. Keep actual effect ordering unqualified until native execution.
- AC2: Claim a current binding before cleanup/acquisition side effects, retire old/current callbacks and pending startup strings on replacement/unmount/HMR, acquire the native cleanup before deferred startup navigation, handle late acquired cleanup after reentry and remain retryable after setup failure. Cleanup is idempotent; failure cannot reactivate an old reader.
- AC3: Initial/live URLs use the normal router with existing admission/cancellation/validation/guards. Do not serialize navigation promises, deduplicate events, force retry blocked links or cancel handed-off work globally. Contain synchronous throws/rejections and observe refusals with fixed diagnostics, suppress late diagnostics and keep newer root ownership intact. No URL/error payload logging.
- AC4: Author nine helper/root-hook source models, reconcile public guide, private host README, Octane navigation guidance and target note, record exact deferred commands and distinguish source/hook mocks from compiler/native cold/warm launch/OS/scheme/signing/focus/AX/memory/installed proof. Keep qualification gates open.

## Documentation

- AC1: [Incoming-link guide](../../../docs/app/navigation.md#handle-incoming-links), [host README](../../../apps/macos/README.md#incoming-route-links), [root entry](../../../apps/macos/src/App.tsx) and [deferred startup leaf](../../../packages/app/src/route-links.macos.ts) explain the import/root boundary and unchanged shared contract.
- AC2: [Host README](../../../apps/macos/README.md#incoming-route-links), [binding](../../../packages/app/src/appkit-route-links.macos.ts) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-incoming-route-link-root-ownership) describe ownership, cleanup, replacement and retry limits.
- AC3: [Incoming-link guide](../../../docs/app/navigation.md#handle-incoming-links), [binding](../../../packages/app/src/appkit-route-links.macos.ts) and [skill](../../skills/octane-xplat/references/navigation.md#appkit-incoming-link-root-ownership) preserve router policy and document fixed diagnostics and lifecycle limits.
- AC4: [Nine source cases](../../../packages/platform/tests/appkit-route-links.test.mjs), [host README](../../../apps/macos/README.md#incoming-route-links) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-incoming-route-link-root-ownership) distinguish authored coverage from deferred execution. The canonical incoming-links recipe keeps its existing web/iOS/Android targets and requirements; this target recipe records AppKit source coverage separately.
