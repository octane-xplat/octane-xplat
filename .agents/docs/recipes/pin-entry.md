# Edit a PIN without shifting cells

ID: pin-entry
Targets: web, ios, android, macos
Related APIs: Field, PinInput, label, description, isDisabled, isReadOnly, isRequired, isOptional, size, status, isLoading, value, onValueChange, onComplete, length, secure

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
- AC4: When composed inside `Field`, the group is associated with the field label and each digit cell has a distinct accessible name without duplicate control IDs.

- AC5: On AppKit, plain Backspace in an empty editable cell requests focus on the preceding mounted cell without editing state or completing the PIN. First/filled/unavailable cells, unrelated targets, prevented events, IME, modified keys and blocked groups keep native editor ownership. Separate authored focus intent from actual native key/focus evidence.

## Documentation

- AC1: [Input ownership](../../../docs/app/primitives.md#edit-a-pin) and maintained [Components demo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Editing behavior](../../../docs/app/primitives.md#edit-a-pin); event examples in `packages/ui/src/components/forms/PinInput.web.test.tsrx`.
- AC3: [Completion and input restrictions](../../../docs/app/primitives.md#edit-a-pin).
- AC4: [Field composition](../../../docs/app/primitives.md#edit-a-pin) and web regression coverage in `packages/ui/src/components/forms/SearchInput.web.test.tsrx`.

- AC5: [AppKit PIN contract](../../../docs/app/primitives.md#pin-fields-on-appkit), appended [AppKit object-driver cases](../../../packages/ui/src/components/forms/pin-input.macos.mobile.test.tsrx) and [target note](../parity/appkit-progress.md#appkit-empty-cell-pin-backspace). Cases remain unrun; physical input and focus are unqualified.
