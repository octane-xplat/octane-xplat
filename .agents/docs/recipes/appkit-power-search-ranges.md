# Edit AppKit date-range filters without a custom editor

ID: appkit-power-search-ranges
Targets: macos
Related APIs: PowerSearch, PowerSearchFilterEditor, DateTimeRange, DateTimeRangePart

## Starting point

The config builder exposes a date field's between operator, but the AppKit
built-in editor previously disabled date_range. The current demo shows structured
string/number filtering, so date-range demand is an explicit extension to common
record filtering, not a newly observed failing demo. Pager's stale audit placeholder
was checked first: source paging already exists and remains runtime-unqualified.

## Acceptance criteria

- AC1: Route AppKit date_range to existing native text/segmented/button controls. Support NOW, UTC absolute date/time and signed/fractional/scientific relative amounts with declared units and preserved anchor metadata. No-op absolute edits preserve original precision/expanded years; new text accepts canonical four-digit UTC dates/date-times without calendar rollover.
- AC2: Validate finite values and start<=end against one current Apply instant, retaining semantic Now/relative values. Offer interval presets as drafts; do not silently interpret expression-string presets or timezoneID. Use the existing fixed-duration matcher and document named anchors as app-owned, unresolved metadata.
- AC3: Keep rapid drafts before render; filter/field/operator revision changes and unmount retire old callbacks. Block readonly filter/editor, disabled/loading PowerSearch and marked-text save; allow Cancel. One draft submits once, consumer throw permits retry and moving-Now validation remains available through Apply.
- AC4: Maintain seven value-model and three editor compiler cases with mock child controls plus an idle fixture, all unrun. Reconcile public guide/skill/feature note, exact deferred commands and remaining native input/IME/AX/layout/popup/clock/consumer qualification. Web/mobile ranges and native entity/nested/custom editors remain gaps; no evidence gate closes.

## Documentation

- AC1–AC4: [Public range form](../../../docs/app/power-search.md#edit-native-appkit-date-ranges), Octane primitives reference, feature note and [target note](../parity/appkit-progress.md#appkit-powersearch-date-range-form).
- AC1–AC2, AC4: [Value model](../../../packages/ui/src/components/forms/power-search-date-range.macos.mobile.test.ts), authored but unrun.
- AC3–AC4: [Mocked-control compiler cases](../../../packages/ui/src/components/forms/power-search-range-editor.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-range.macos.tsrx), authored but unrun. These do not qualify real control events, focus, IME or AX.
