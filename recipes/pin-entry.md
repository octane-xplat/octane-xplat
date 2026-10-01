# Edit a PIN without shifting cells

ID: pin-entry
Targets: web, ios, android, macos
Related APIs: PinInput, value, onValueChange, onComplete, length, secure, isDisabled, isReadOnly

## Starting point

A working app with a form and an app-owned completion handler. PIN values
use a contiguous string rather than positional empty-cell placeholders.

## Requirements

- Choose controlled or component-owned input state.
- Enter, replace, and clear digits without moving them into other cells.
- Submit only a full-length value and distinguish edits from external updates.

## Acceptance criteria

- AC1: Controlled state follows onValueChange; omitting value uses component-owned state, with entry advancing focus to the next editable cell.
- AC2: Clearing an interior cell clears its suffix; replacing a filled cell preserves subsequent cells, and entry cannot create gaps.
- AC3: Completion fires after a full-length edit, not an incomplete edit or external value update; secure masks cells and `isDisabled`/`isReadOnly` prevent editing.

## Documentation

- AC1: [Input ownership](../docs/primitives.md#edit-a-pin) and maintained [Components demo](../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Editing behavior](../docs/primitives.md#edit-a-pin); event examples in `packages/ui/src/PinInput.web.test.tsrx`.
- AC3: [Completion and input restrictions](../docs/primitives.md#edit-a-pin).
