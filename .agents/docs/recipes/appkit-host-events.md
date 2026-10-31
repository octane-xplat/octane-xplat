# Keep native AppKit platform event readers independently owned

ID: appkit-host-events
Targets: macos
Related APIs: onDeepLink, consumeInitialUrl, useAppState, useWindowSize

## Starting point

The private native AppKit proving host delivers activity, resize and incoming
URLs to framework readers. Its responsive/Services fixtures need live layout and
activity, and its maintained native route-link installer consumes launch links. Use the
existing host bridge and listener sets; no new dependency or native engine.

## Requirements

Deliver native AppKit activity, resize and incoming URLs to framework readers
through owned, isolated listener sets with consume-once queueing.

## Acceptance criteria

- AC1: Capture native listener membership before each broadcast, skip removed registrations, keep newly added/re-registered callbacks for the next broadcast, and isolate synchronous live consumer errors, without claiming to await async work. Capture one resize-window payload and commit activity before notification. Keep registrations independently owned/idempotently removable even with identical callbacks.
- AC2: Preserve URL queuing with no readers, synchronous queued delivery and consume-once semantics. An initial queued handler failure retires its registration, restores that failed and remaining queue ahead of newer pending URLs, preserves successfully delivered URLs as consumed, and rethrows the original error. No hidden automatic retry, routing-success or cross-event reentrancy ordering claim.
- AC3: Author seven actual-host method/helper source models and adapt the existing window fixture to load the real helper. Reconcile public/skill guidance and target note with exact deferred commands and distinction between source/JS models and ObjC/OS/input/AX/memory/installed behavior. Leave qualification gates open.

## Documentation

- AC1: [Host delegate and service installer](../../../apps/macos/src/appkit.ts), [owned event helpers](../../../apps/macos/src/platform-events.ts), [source models](../../../packages/platform/tests/appkit-events.test.mjs) and [existing window models](../../../packages/platform/tests/appkit-window.test.mjs).
- AC2: [Incoming AppKit links](../../../docs/platform/platform-services.md#handle-incoming-appkit-links), [native route consumer](../../../packages/app/src/route-links.macos.ts), [source models](../../../packages/platform/tests/appkit-events.test.mjs) and [Octane guidance](../../skills/octane-xplat/references/services/environment.md#appkit-host-event-delivery).
- AC3: [Target note](../exploration.md#operational-evidence). All seven new cases, existing window models, native callback/URL launch/resize/activity/input/AX/memory and installed consumers require separate execution evidence/unqualified. Fake NSObject/NativeClass only permit source-policy checks; no native class or OS loop is exercised. The existing platform-state fixture require separate execution evidence separately.
