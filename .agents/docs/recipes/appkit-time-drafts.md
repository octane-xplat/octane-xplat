# Preserve current AppKit time and date-time drafts

ID: appkit-time-drafts
Targets: macos
Related APIs: TimeInput, DateTimeInput, hasSeconds, changeAction, hasClear

## Starting point

A controlled booking/settings time or date-time field with typing, Return/blur commit and a
pending save. Native support remains experimental.

## Acceptance criteria

- AC1: Text/submit/clear handlers check current native attachment, disabled/read-only/loading, callback reentry and pending-save ownership before draft writes. Retained callbacks use latest pending text, seconds and bounds. Work rejected by these ownership guards preserves the draft; parent correction remains authoritative. Completed invalid drafts retain the existing submit/blur revert behavior.
- AC2: Reuse the existing AppKit marked-editor composition guard. Do not commit composing text; release commit only after composition ends. Post-callback draft clearing requires the same draft and live input; teardown leaves held callbacks inert.
- AC3: Keep source/object-driver evidence separate from real native editor/IME/Return/blur/save/ref/caret/focus/AX and packaging. Distinguish TimeInput/DateTimeInput source coverage and exact deferred checks.

- AC4: DateTimeInput owns separate date/time pending text and date-less time state, reads current locale/parts/seconds/endpoints and rejects constraint-driven metadata replacement/reentry. Cleanup preserves current drafts, attachment and parent correction; unchanged committed values do not repeat change/save. Preserve existing marked-text/preset/key policies and qualify native integration separately.

## Documentation

- AC1: [Time draft guide](../../../docs/platform/date-picker.md#keep-appkit-time-drafts-owned-by-the-current-edit), [target leaf](../../../packages/ui/src/components/forms/TimeInput.macos.tsrx), six [authored cases](../../../packages/ui/src/components/forms/time-draft.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/time-draft.macos.tsrx). All cases unrun.
- AC2: The same source/cases and [existing composition helper](../../../packages/ui/src/components/forms/date-composition.macos.ts) distinguish existing native marked-text support from this new draft ownership work.
- AC3: [Target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-timeinput-current-draft-ownership) records exact deferred commands and remaining gates. Fake dispatch is not OS input evidence.

- AC4: [Current date-time draft guide](../../../docs/platform/date-picker.md#keep-both-appkit-date-time-drafts-current), [DateTimeInput leaf](../../../packages/ui/src/components/forms/DateTimeInput.macos.tsrx), eight [authored cases](../../../packages/ui/src/components/forms/datetime-draft.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/datetime-draft.macos.tsrx) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-datetimeinput-current-draft-ownership). All cases unrun; Popover is mocked away and native integration remains unqualified.
