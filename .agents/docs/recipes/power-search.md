# Build a structured search field

ID: power-search
Targets: web, ios, android, macos
Related APIs: PowerSearch, PowerSearchConfig, PowerSearchFilter, PowerSearchFilterEditor, PowerSearchField, createPowerSearchConfig, usePowerSearchConfig, IntegerOperatorValue, FloatOperatorValue, DateAbsoluteOperatorValue, FilterValueDateAbsolute, DateTimeRange, DateTimeRangePart, EntityListOperatorValue, Tokenizer, hasAutoFocus, handleRef

## Starting point

The app has a collection or query endpoint and needs users to combine field,
operator, and value filters. The reader knows controlled component state.

## Requirements

- Describe configured fields/operators and keep active filters in app state.
- Let users find a field or value suggestion, add/edit/remove filters, and clear the active set.
- Apply filters to local data where supported, and route unsupported value types to a custom editor or server query.
- Keep labels and edits usable on touch and keyboard targets.
- On AppKit, manage focus and edit scalar, date, range, and entity filters with owned drafts and validation.

## Acceptance criteria

- AC1: A controlled PowerSearch example shows config creation, change handling, and applying active filters.
- AC2: The guide explains field definitions, custom configs, value-type overrides, and local-filter limits.
- AC3: The guide states native/web focus, typeahead, localization, date editor, and popover sizing coverage.

- AC4: On AppKit, numeric Apply accepts finite decimal/scientific input; rejects blank/nondecimal/partial/nonfinite input, unsafe/fractional integers and inclusive-bound violations. Invalid/nonfinite/reversed configured bounds block saving, never clamp. Display units/bounds; document dot decimal and exact-integer limits.
- AC5: On AppKit, keep rapid scalar changes before render, reset on current filter/field/operator replacement, reject stale/readonly/unmounted/marked-text saves and stale changes. Submit once per draft before consumer reentry, release on consumer throw. Cancel retires the session without saving.
- AC6: On AppKit, missing operator uses configured default, then first; unknown explicit field/operator disables Apply without silently choosing another filter. Matching scalar type owns seeding/conversion. Invalid absolute dates render without a conversion exception; absolute-date precision is covered separately in AC8–AC10, and other scalar validation remains a separate gap.
- AC7: On AppKit, maintain five model/five mocked-control scalar cases and an idle fixture. Reconcile public/skill/feature/target guidance, exact deferred commands and source-vs-runtime limits; do not close the broader editor or native qualification gate.
- AC8: On AppKit, reuse the range form's strict UTC parser for absolute dates. Preserve unchanged stored precision/time/expanded years. Typed four-digit-year dates/date-times accept UTC, seconds/milliseconds, with a plain date meaning midnight; reject invalid calendar rollover, incomplete/ambiguous/offset text and nonfinite/out-of-range stored drafts without exceptions or NaN saves.
- AC9: On AppKit, honor isDateOnly by showing the UTC date and deliberately saving midnight, rejecting typed time. Preserve stored expanded-year days on unchanged date-only Apply and floor pre-epoch fractional milliseconds to the correct UTC day. Include mode in draft ownership; reuse scalar read-only/composition/stale/Cancel/submit guards.
- AC10: On AppKit, clearly label UTC and document timezoneID/calendar-widget/language-parsing limitations, storage/no-op/date-only behavior and source-vs-runtime evidence. Maintain six model and two additional mocked-control scalar cases plus expanded idle fixture; exact deferred commands remain recorded and no qualification gate closes.
- AC11: On AppKit, route date_range to existing native text/segmented/button controls. Support NOW, UTC absolute date/time and signed/fractional/scientific relative amounts with declared units and preserved anchor metadata. No-op absolute edits preserve original precision/expanded years; new text accepts canonical four-digit UTC dates/date-times without calendar rollover.
- AC12: On AppKit, validate finite values and start<=end against one current Apply instant, retaining semantic Now/relative values. Offer interval presets as drafts; do not silently interpret expression-string presets or timezoneID. Use the existing fixed-duration matcher and document named anchors as app-owned, unresolved metadata.
- AC13: On AppKit, keep rapid drafts before render; filter/field/operator revision changes and unmount retire old callbacks. Block readonly filter/editor, disabled/loading PowerSearch and marked-text save; allow Cancel. One draft submits once, consumer throw permits retry and moving-Now validation remains available through Apply.
- AC14: On AppKit, maintain seven value-model and three editor compiler cases with mock child controls plus an idle fixture. Reconcile public guide/skill/feature note, exact deferred commands and remaining native input/IME/AX/layout/popup/clock/consumer qualification. Web/mobile ranges, native entity runtime and native nested/custom editors remain unqualified; no evidence gate closes.
- AC15: On AppKit, route entity_list into controlled Tokenizer selection, source lookup, custom rows, optional arbitrary strings, removal/clear and read-only behavior. Preserve source draft rows; store only id/label/optional top-level string photo, deduplicated by exact ID. Explain missing-source behavior and app/backend matching.
- AC16: On AppKit, offer configured paste splitting through a separate explicit Add entries action. Trim/deduplicate tokens, optionally sort by JS string order, use comma/newline by default, exclude regex captures/zero-width matches. Resolve serially with fresh request signals, exact ID then unique case-sensitive label, no fuzzy/ambiguous automatic picks. Publish all entries atomically; preserve drafts and show generic invalid-regex/lookup/match errors.
- AC17: On AppKit, retain rapid edits; current filter/field/operator/source/tokenization revision, read-only, Cancel and unmount retire pending work. Block edit/repeat/Apply while pending, guard bulk marked-text, never discard unprocessed pasted text on Apply. One draft saves once, consumer throw permits retry. Cancellation must discard ignored-signal late results.
- AC18: On AppKit, maintain seven model and five mocked-control editor cases plus an idle fixture. Reconcile public guide, Octane skill, feature note and exact deferred commands. Clearly retain native control/input/IME/AX/focus/popover/source timing/consumer qualification and web/mobile entity/nested/custom parity gaps; close no evidence gate.
- AC19: On AppKit, replace one-shot focus with the existing AppKit request owner. Observe the first attached/visible native input; current inherited blocking, editing, changed responder, user activity, native replacement and teardown cancel stale work. Claim before callbacks and release observation. False-to-true rearms; unblocking alone does not. Never activate windows.
- AC20: On AppKit, deliver a stable handle through the existing callback contract. Resolve current input/blocking, preserve foreign blur, and become inert after teardown. Keep TextInput/TextArea's public prop shapes unchanged.
- AC21: On AppKit, keep source/fake dispatch separate from native attachment/notification/focus/caret/IME/modal/AX and packaging; document exact deferred commands and inline editor/popover limits.

## Documentation

- AC1: [Structured search guide](../../../docs/app/power-search.md#structured-search), the [book-search walkthrough](../../../examples/search/filter-books.tsx), and the maintained [PowerSearch demo](../../../packages/demos/src/PowerSearchDemo.tsrx).
- AC2: [Field definitions and filter limits](../../../docs/app/power-search.md#field-definitions-and-local-filtering).
- AC3: [Portable implementation and upstream seams](../../../docs/app/power-search.md#portable-implementation-and-upstream-seams).

- AC4: [Public numeric/scalar workflow](../../../docs/app/power-search.md#validate-native-appkit-numeric-filters), Octane primitives reference, feature note, [target note](../exploration.md#operational-evidence) and [numeric model cases](../../../packages/ui/src/components/forms/power-search-number.macos.mobile.test.ts).
- AC5: The same [numeric/scalar workflow](../../../docs/app/power-search.md#validate-native-appkit-numeric-filters) and [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx); not native control/input proof.
- AC6: The same [numeric/scalar workflow](../../../docs/app/power-search.md#validate-native-appkit-numeric-filters) and [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx); not native control/input proof.
- AC7: [Manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx); mounts only, applies no filter automatically.
- AC8: [Public absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), Octane primitives reference, feature note, [target progress](../exploration.md#operational-evidence) and [date model cases](../../../packages/ui/src/components/forms/power-search-absolute-date.macos.mobile.test.ts).
- AC9: The same [absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), [date model cases](../../../packages/ui/src/components/forms/power-search-absolute-date.macos.mobile.test.ts), [scalar mocked-control cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx); not native input/calendar/AX evidence.
- AC10: The same [absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), [scalar mocked-control cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx) and [target progress](../exploration.md#operational-evidence); not native input/calendar/AX evidence.
- AC11: [Public range form](../../../docs/app/power-search.md#edit-native-appkit-date-ranges), Octane primitives reference, feature note, [target note](../exploration.md#operational-evidence) and [value model](../../../packages/ui/src/components/forms/power-search-date-range.macos.mobile.test.ts).
- AC12: The same [range form](../../../docs/app/power-search.md#edit-native-appkit-date-ranges) and [value model](../../../packages/ui/src/components/forms/power-search-date-range.macos.mobile.test.ts).
- AC13: The same [range form](../../../docs/app/power-search.md#edit-native-appkit-date-ranges), plus [mocked-control compiler cases](../../../packages/ui/src/components/forms/power-search-range-editor.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-range.macos.tsrx). These do not qualify real control events, focus, IME or AX.
- AC14: The same [range form](../../../docs/app/power-search.md#edit-native-appkit-date-ranges), [value model](../../../packages/ui/src/components/forms/power-search-date-range.macos.mobile.test.ts), [mocked-control compiler cases](../../../packages/ui/src/components/forms/power-search-range-editor.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/power-search-range.macos.tsrx) and [target note](../exploration.md#operational-evidence). These do not qualify real control events, focus, IME or AX.
- AC15: [Public entity workflow](../../../docs/app/power-search.md#edit-native-appkit-entity-filters), Octane primitives reference, feature note, [target progress](../exploration.md#operational-evidence), [value/batch cases](../../../packages/ui/src/components/forms/power-search-entities.macos.mobile.test.ts) and [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-entity-editor.macos.mobile.test.tsrx). Mock controls do not prove native input/selection/IME/AX.
- AC16: The same [entity workflow](../../../docs/app/power-search.md#edit-native-appkit-entity-filters), [value/batch cases](../../../packages/ui/src/components/forms/power-search-entities.macos.mobile.test.ts) and [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-entity-editor.macos.mobile.test.tsrx). Mock controls do not prove native input/selection/IME/AX.
- AC17: The same [entity workflow](../../../docs/app/power-search.md#edit-native-appkit-entity-filters), [value/batch cases](../../../packages/ui/src/components/forms/power-search-entities.macos.mobile.test.ts), [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-entity-editor.macos.mobile.test.tsrx) and [target progress](../exploration.md#operational-evidence).
- AC18: [Idle manual fixture](../../../examples/probes/power-search-entities.macos.tsrx). It mounts controls only and applies no filter automatically.
- AC19: [Guide](../../../docs/app/power-search.md#request-initial-appkit-search-focus), [target view](../../../packages/ui/src/components/forms/PowerSearchView.macos.tsrx), five [authored cases](../../../packages/ui/src/components/forms/power-search-focus.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-focus.macos.tsrx). The existing private autofocus policy is reused.
- AC20: The same [source](../../../packages/ui/src/components/forms/PowerSearchView.macos.tsrx)/[cases](../../../packages/ui/src/components/forms/power-search-focus.macos.mobile.test.tsrx) cover callback replacement/current blocking/foreign blur/teardown. No null callback notification or new shared input autofocus prop is introduced.
- AC21: [Target note](../exploration.md#operational-evidence) records exact deferred commands. Popover is mocked away in the object-driver cases, so modal behavior is not established.

## Historical audit mapping

Previous AppKit recipe assessments remain under their original recipe and criterion IDs in Silo. These map to the criteria above; they are historical evidence and do not qualify this revision.

| Previous recipe ID | Previous criteria | Current criteria |
| --- | --- | --- |
| `appkit-power-search-scalars` | AC1–AC4 | AC4–AC7 |
| `appkit-power-search-absolute-dates` | AC1–AC3 | AC8–AC10 |
| `appkit-power-search-ranges` | AC1–AC4 | AC11–AC14 |
| `appkit-power-search-entities` | AC1–AC4 | AC15–AC18 |
| `appkit-power-search-focus` | AC1–AC3 | AC19–AC21 |

## GTK coverage

`PowerSearch`, `PowerSearchToken`, `PowerSearchFilterEditor` and
`usePowerSearchConfig` are curated GTK root exports. The public-root
[power-search fixture](../../../packages/linux-gtk-renderer/test/ui-powersearch.test.mts)
runs 11 assertions with real X11 input: typing a field token, opening the
filter editor, applying a filter, and pressing a token to reopen its
editor. This contributes to AC1 and the typeahead/popover portions of AC3
on the GTK target; local-filter execution against app data, localization
and packaged-consumer behavior are not established. Record GTK coverage
separately from execution evidence in gtk_recipe_checks.
