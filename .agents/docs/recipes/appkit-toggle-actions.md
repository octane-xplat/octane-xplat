# Save a pin with an AppKit toggle button

ID: appkit-toggle-actions
Targets: macos
Related APIs: ToggleButton, ToggleButtonGroup, Button

## Starting point

A pin/favorite action saves the next pressed state asynchronously.

## Acceptance criteria

- AC1: Uncontrolled state flips before onPressedChange/save; controlled display follows the parent. Use Button busy ownership to block duplicate noninterruptible presses and track interruptible overlap. Failures report without rollback; unmount cancels pending UI writes.
- AC2: Forward inherited Button metadata/loading/icon-only behavior and node icons. Group membership owns single/multiple selection, ignores member actions and honors disablement.
- AC3: Native pressed button hosts expose numeric checked values and value-change notifications; ordinary buttons regain their role when pressed state is removed.
- AC4: Separate authored source/object-driver/direct-dispatch cases from native mouse/keys, VoiceOver, busy appearance and packaging. Keep group/toolbar roving, tooltip and reserved label width gaps visible.

## Documentation

- AC1: [Toggle save guide](../../../docs/app/components.md#save-a-toggle-button-action-on-appkit) and [authored action cases](../../../packages/ui/src/toggle-button.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/cases cover group policy, metadata and icons; existing ActionControlsDemo retains the public API.
- AC3: [Native pressed contract](../../../packages/macos-renderer/README.md#pressed-action-accessibility) and [authored renderer cases](../../../packages/macos-renderer/test/common-control-accessibility.test.ts).
- AC4: [Target note](../parity/appkit-progress.md#appkit-toggle-button-action-ownership), [direct-dispatch fixture](../../../examples/probes/toggle-button.macos.tsrx) and exact deferred commands. The fixture is unrun.
