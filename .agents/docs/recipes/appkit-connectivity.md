# Keep AppKit network and activity readers alive and owned

ID: appkit-connectivity
Targets: macos
Related APIs: connectivity, ConnectivityState, environment, RuntimeEnvironment

## Starting point

The native Services screen and query scheduler need current network/activity
state. Reuse the existing Network.framework bridge and shared environment shape;
no dependency or native engine changes. An available route is not proof of
internet access. Unknown connectivity must not become measured offline.

## Requirements

Read current network and activity state on AppKit through owned native monitors
that share samples, isolate failures and retire cleanly.

## Acceptance criteria

- AC1: Share a current bridge-owned monitor across independent registrations, keep monitored reads on its latest sample, return independent state objects, isolate event-time consumer failures, retain native one-shot reads without subscribers, and retire before cleanup despite stop failure. Reject stale/partial/replaced bridges, make teardown idempotent and buffer synchronous startup samples until acquisition succeeds.
- AC2: Acquire activity/network cleanup before one initial environment notification, unwind either acquisition/initial callback failure, consume network callback samples without a second synchronous probe, retain unknown capabilities, preserve native method receivers, ignore retired activity callbacks and attempt both cleanup handles once even if either throws. Native event-time consumer failure must not block other app listeners.
- AC3: Subscribe the AppKit Services status for its screen lifetime, distinguish unknown/unavailable/available route and actual transport, explain request reachability limits, and reconcile public/skill guidance, source models and deferred commands. Keep runtime gates open.

## Documentation

- AC1: [Public route guide](../../../docs/platform/platform-services.md#appkit-route-updates), [monitor owner](../../../packages/platform/src/connectivity.macos.ts) and [connectivity models](../../../packages/platform/tests/connectivity.macos.test.mjs). Five added cases are authored. Native Network.framework callbacks/threading/BOOL/cancellation and physical route transitions require separate target qualification.
- AC2: [Environment adapter](../../../packages/platform/src/environment.macos.ts), [environment models](../../../packages/platform/src/environment.macos.test.ts) and [skill guidance](../../skills/octane-xplat/references/services/networking.md#appkit-network-route-updates). Five added cases are authored. Query engine shared scheduler semantics are unchanged; the source graph reports incomplete callback edges.
- AC3: [Services screen](../../../packages/app/src/Services.macos.tsrx), [public guide](../../../docs/platform/platform-services.md#appkit-route-updates), fix note and [target note](../exploration.md#operational-evidence). All authored models, native route/activity/input/AX/memory and installed consumers require separate execution evidence/unqualified. No network, native/UI or visual automation is performed by this change.
