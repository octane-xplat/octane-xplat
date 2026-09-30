# `@octane-xplat/date-picker`

An install boundary for platform-specific date and time selection controls:
a SwiftUI `DatePicker` on iOS, Material 3 `DatePicker`/`TimePicker` built with
Jetpack Compose on Android, a labeled `<input type="date|time|datetime-local">`
on web, and a real `NSDatePicker` on macOS.

Install the package in the app that renders a control. Import
`SwiftUIDatePicker` from `@octane-xplat/date-picker/ios`,
`MaterialDatePicker` from `@octane-xplat/date-picker/android`, `DateInput`
from `@octane-xplat/date-picker/web`, or `AppKitDatePicker` from
`@octane-xplat/date-picker/macos` in the matching platform-suffixed file.
Each entry exports its own component and types; there is no shared date-picker
API at the package root.

The platform APIs use their own selection vocabulary: the iOS entry takes a
controlled `selection`/`defaultSelection` `Date` with `displayedComponents`
and `pickerStyle`; the Android entry follows the uncontrolled
`initialDate`/`onDateSelected` model of the Material 3 pickers with
`selectableDates` range bounds; the web entry follows browser input values;
the macOS entry takes `components`/`pickerStyle` (`'graphical'` embeds the
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
