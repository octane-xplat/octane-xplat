# Keep native AppKit menus scoped to their current record and view

ID: appkit-native-context-menu
Targets: macos
Related APIs: AppKitContextMenu, AppKitContextMenuItem, AppKitContextMenuProps

## Starting point

The retained native-context-menu demo was a placeholder, while the package and
renderer already attached NSMenu. Source review found a one-time descendant-menu
overwrite, lost prior slots and unguarded stale/disabled/partial-failure actions.
Common row/file actions motivate this work. An action/delegate selector metadata
prerequisite was repaired first; none of this is native input evidence.

## Acceptance criteria

- AC1: Own current view/item/scope sessions; snapshot primitive content and detect in-place changes while equal arrays/callback-only changes preserve the menu. Record id/view/content replacement and teardown retire callbacks before cleanup; current handlers receive enabled IDs only, blocking removed/unknown/stale/reentrant selections. Reject duplicate IDs or non-string IDs/titles with a generic status; empty content removes this custom menu and the trigger stays inline.
- AC2: Reuse the renderer bridge and attach only at the wrapper, preserving descendant editing/nested menus and later children through the documented AppKit responder-chain design. Guard native enabled state/window/menu-slot ownership, cancel owned tracking, restore prior active menus while skipping retired ones, preserve foreign replacements and clean partial construction/slot failure without leaking action entries or exception details.
- AC3: Replace the AppKit demo placeholder with scope/callback/item/disabled/order/invalid/empty/remount controls, nested menus, editable and independently added children, plus a delayed scope change. The idle probe reuses this demo. Author eight owner-model and seven actual-renderer-branch cases, all unrun; direct fake dispatch cannot qualify OS routing/tracking/keyboard/AX/cancellation.
- AC4: Reconcile README, public guide, skill, feature and target note with unique IDs, record ownership, flat native menu/no destructive role, preserved child menus, metadata prerequisite and source-vs-runtime limits. Record exact deferred commands and missing standalone demos/docs tasks; leave broader control/qualification gates open.

## Documentation

- AC1–AC4: [Public native menus](../../../docs/platform/context-menu.md#native-macos-menus), [package README](../../../packages/context-menu/README.md), Octane primitives reference, feature note and [target progress](../parity/appkit-progress.md#appkit-native-context-menu-ownership-and-restoration).
- AC1: [Owner-model cases](../../../packages/context-menu/tests/context-menu-owner.macos.test.mjs), authored but unrun.
- AC2: [Actual renderer-branch cases](../../../packages/macos-renderer/test/context-menu.test.ts), authored but unrun; simulated menu slots/actions do not prove native responder propagation or tracking.
- AC3: [Maintained demo](../../../packages/demos/src/NativeContextMenuDemo.macos.tsrx) and [idle probe](../../../examples/probes/native-context-menu.macos.tsrx), authored but unrun. The delayed operation starts only after an explicit button action; no menu/input operation runs automatically.
