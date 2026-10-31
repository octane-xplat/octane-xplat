# Preserve and validate AppKit absolute date filters

ID: appkit-power-search-absolute-dates
Targets: macos
Related APIs: PowerSearchFilterEditor, DateAbsoluteOperatorValue, FilterValueDateAbsolute

## Starting point

The config builder exposes date-before/after operators, and the AppKit form
displayed a date-only slice and coerced it back to midnight without validation.
Source review found no-op timestamp loss and possible NaN/calendar rollover.
Date-filter demand extends common record filtering beyond the maintained demo's
book title/year fields; no runtime failure was observed.

## Requirements

Edit absolute-date filters in the AppKit PowerSearch editor with strict UTC
parsing, preserved precision and explicit limits.

## Acceptance criteria

- AC1: Reuse the range form's strict UTC parser for absolute dates. Preserve unchanged stored precision/time/expanded years. Typed four-digit-year dates/date-times accept UTC, seconds/milliseconds, with a plain date meaning midnight; reject invalid calendar rollover, incomplete/ambiguous/offset text and nonfinite/out-of-range stored drafts without exceptions or NaN saves.
- AC2: Honor isDateOnly by showing the UTC date and deliberately saving midnight, rejecting typed time. Preserve stored expanded-year days on unchanged date-only Apply and floor pre-epoch fractional milliseconds to the correct UTC day. Include mode in draft ownership; reuse scalar read-only/composition/stale/Cancel/submit guards.
- AC3: Clearly label UTC and document timezoneID/calendar-widget/language-parsing limitations, storage/no-op/date-only behavior and source-vs-runtime evidence. Maintain six model and two additional mocked-control scalar cases plus expanded idle fixture; exact deferred commands remain recorded and no qualification gate closes.

## Documentation

- AC1: [Public absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), Octane primitives reference, feature note, [target progress](../exploration.md#operational-evidence) and [date model cases](../../../packages/ui/src/components/forms/power-search-absolute-date.macos.mobile.test.ts).
- AC2: The same [absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), [date model cases](../../../packages/ui/src/components/forms/power-search-absolute-date.macos.mobile.test.ts), [scalar mocked-control cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx); not native input/calendar/AX evidence.
- AC3: The same [absolute-date workflow](../../../docs/app/power-search.md#edit-native-appkit-absolute-dates), [scalar mocked-control cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx) and [target progress](../exploration.md#operational-evidence); not native input/calendar/AX evidence.
