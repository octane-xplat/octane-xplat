# `@octane-xplat/date-picker`

An install boundary for platform-specific date and time selection controls:
a SwiftUI `DatePicker` on iOS, Material 3 `DatePicker`/`TimePicker` built with
Jetpack Compose on Android, and a real `NSDatePicker` on macOS. For portable
form controls, use `Calendar`, `DateInput`, `TimeInput`, `DateTimeInput`, and
`DateRangeInput` from `@octane-xplat/ui` on every target.

Install the package in the app that renders a control. Import
`SwiftUIDatePicker` from `@octane-xplat/date-picker/ios`,
`MaterialDatePicker` from `@octane-xplat/date-picker/android`, or
`AppKitDatePicker` from `@octane-xplat/date-picker/macos` in the matching
platform-suffixed file. These native entries have platform-specific contracts.
The old `@octane-xplat/date-picker/web` `DateInput` subpath was removed because
its browser-only string contract conflicted with the shared `DateInput` API.

The platform APIs use their own selection vocabulary: the iOS entry takes a
controlled `selection`/`defaultSelection` `Date` with `displayedComponents`
and `pickerStyle`; the Android entry follows the uncontrolled
`initialDate`/`onDateSelected` model of the Material 3 pickers with
`selectableDates` range bounds; the macOS entry takes
`components`/`pickerStyle` (`'graphical'` embeds the
inline calendar) with a controlled `selection` `Date`.

Android notes: give `MaterialDatePicker` a bounded height (the M3 calendar's
lazy grid collapses under unbounded height), and keep `initialDate` and
`selectableDates` identity-stable — the provider keys its state `remember`
on them, so a per-render `new Date()` resets the selection.
See the framework guide for details and maintained examples:
[`docs/date-picker.md`](../../docs/date-picker.md).

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/DatePickerView.swift` and
`android/.../ui/DatePickerView.kt`. Attribution headers sit on the ported
files.
