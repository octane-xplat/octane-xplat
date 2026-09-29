# `@octane-xplat/native-picker`

A single-selection picker leaf with SwiftUI on iOS, Jetpack Compose on Android,
and an HTML `<select>` on web.

Install this package in the app that renders the control. Import `NativePicker`
from `@octane-xplat/native-picker/ios`, `/android`, or `/web` in the matching
platform-suffixed file. Import `NativePickerProps` and `NativePickerOption`
from `@octane-xplat/native-picker/types` where shared types are needed. The
platform entry installs its bridge adapter and native build hooks.

The API supports a string `value` plus `onValueChange` for controlled use, or
`defaultValue` for uncontrolled use. Options contain unique string values,
labels, and optional disabled states. See the framework guide for build details,
limits, and the maintained example: [`docs/native-picker.md`](../../docs/native-picker.md).
