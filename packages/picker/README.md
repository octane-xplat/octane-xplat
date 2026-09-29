# `@octane-xplat/picker`

An install boundary for platform-specific selection controls: a SwiftUI `Picker`
on iOS, a Material 3 dropdown built with Jetpack Compose on Android, and an
HTML `<select>` on web.

Install the package in the app that renders a control. Import `SwiftUIPicker`
from `@octane-xplat/picker/ios`, `MaterialDropdown` from
`@octane-xplat/picker/android`, or `Select` from `@octane-xplat/picker/web` in
the matching platform-suffixed file. Each entry exports its own component and
types; there is no shared picker API at the package root.

The platform APIs use their own selection vocabulary and option shapes. The iOS
entry uses SwiftUI selection IDs, the Android entry uses Material dropdown keys
and enabled states, and the web entry follows browser select values. See the
framework guide for details and maintained examples:
[`docs/native-picker.md`](../../docs/native-picker.md).
