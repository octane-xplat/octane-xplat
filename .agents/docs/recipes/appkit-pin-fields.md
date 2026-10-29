# Label and gate AppKit PIN entry

ID: appkit-pin-fields
Targets: macos
Related APIs: PinInput, Field

## Starting point

A multi-cell code entry control, standalone or inside an existing Field.

## Acceptance criteria

- AC1: Resolve inherited metadata and disabled/read-only state, render standalone Field metadata once and give cells unique IDs and digit names. Preserve entered values/native hosts through validation changes.
- AC2: Block edits from inherited gates and cancel pending focus when disabled/read-only or when the destination falls outside the current length. Keep controlled parent ownership and existing completion semantics.
- AC3: Preserve and disclose shared paste/deletion semantics; distinguish direct handler/fake focus cases from real keyboard/caret/IME, native secure fields, VoiceOver and OTP qualification.

## Documentation

- AC1: [PIN field guide](../../../docs/app/primitives.md#pin-fields-on-appkit) and [authored source cases](../../../packages/ui/src/components/forms/pin-input.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same cases cover inherited blocking and pending-focus cancellation; [target note](../parity/appkit-progress.md#appkit-pin-field-ownership) records exact deferred commands.
- AC3: The guide/target note retain last-character paste, suffix deletion, empty-cell Backspace and OTP/native qualification boundaries. No OS input/secure-field evidence is claimed.
