# Enable AppKit control actions after mount

ID: appkit-click-actions
Targets: macos
Related APIs: Checkbox, Switch, RadioList, CheckboxList

## Starting point

A self-drawn choice is disabled or read-only on mount and enabled later.

## Acceptance criteria

- AC1: An existing accessibility/action ID must not prevent acquiring a click recognizer when a callback appears. Update callbacks through one recognizer without duplicate delivery; clearing a noninteractive host must not manufacture an action.
- AC2: Callback removal disables the recognizer, re-adding reuses it, raw disabled changes update its state and queued callbacks still reject disabled actions.
- AC3: Teardown disables/removes owned click recognizers. Keep source cases separate from real pointer/keyboard re-enable behavior, native gesture arbitration and packaged lifecycle evidence.

## Documentation

- AC1: [Click ownership contract](../../../packages/macos-renderer/README.md#update-self-drawn-click-actions) and [authored lifecycle source cases](../../../packages/macos-renderer/test/click-action-lifecycle.test.ts). Tests unrun.
- AC2: The same contract/cases and [queued press guard case](../../../packages/macos-renderer/test/gestures.test.ts); actual raw disabled updates still require native verification.
- AC3: [Target note](../exploration.md#operational-evidence) records teardown source scope and exact deferred commands. No native lifecycle/OS input evidence is claimed.
