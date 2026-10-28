# Preserve the current AppKit time draft

ID: appkit-time-drafts
Targets: macos
Related APIs: TimeInput, hasSeconds, changeAction, hasClear

## Starting point

A controlled booking/settings time field with typing, Return/blur commit and a
pending save. Native support remains experimental.

## Acceptance criteria

- AC1: Text/submit/clear handlers check current native attachment, disabled/read-only/loading, callback reentry and pending-save ownership before draft writes. Retained callbacks use latest pending text, seconds and bounds. Rejected work preserves the draft; parent correction remains authoritative.
- AC2: Reuse the existing AppKit marked-editor composition guard. Do not commit composing text; release commit only after composition ends. Post-callback draft clearing requires the same draft and live input; teardown leaves held callbacks inert.
- AC3: Keep source/object-driver evidence separate from real native editor/IME/Return/blur/save/ref/caret/focus/AX and packaging. Document the independent DateTimeInput draft seam and exact deferred checks.

## Documentation

- AC1: [Time draft guide](../../../docs/platform/date-picker.md#keep-appkit-time-drafts-owned-by-the-current-edit), [target leaf](../../../packages/ui/src/TimeInput.macos.tsrx), six [authored cases](../../../packages/ui/src/time-draft.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/time-draft.macos.tsrx). All cases unrun.
- AC2: The same source/cases and [existing composition helper](../../../packages/ui/src/date-composition.macos.ts) distinguish existing native marked-text support from this new draft ownership work.
- AC3: [Target note](../parity/appkit-progress.md#appkit-timeinput-current-draft-ownership) records exact deferred commands and remaining gates. Fake dispatch is not OS input evidence.
