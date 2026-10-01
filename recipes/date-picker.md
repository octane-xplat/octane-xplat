# Add a platform-native date or time picker

ID: date-picker
Targets: web, ios, android
Related APIs: @octane-xplat/date-picker, SwiftUIDatePicker, MaterialDatePicker, DateInput

## Starting point

A scaffolded Octane Xplat app with web, iOS, and Android targets. The reader
can add a workspace or published package and place platform-specific imports
behind the established file suffixes.

## Requirements

- Present date or time selection through a SwiftUI `DatePicker` on iOS, a Compose Material 3 `DatePicker`/`TimePicker` on Android, and a browser date/time input on web.
- Keep each platform's component name, selection model (controlled `Date` on iOS, uncontrolled `initialDate`/`onDateSelected` on Android, browser value strings on web), and callback contract explicit.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import `SwiftUIDatePicker`, `MaterialDatePicker`, `DateInput`, and `AppKitDatePicker` from matching target-suffixed modules without runtime platform branching.
- AC2: Documentation gives each platform component its own selection and callback contract and does not expose a shared date-picker component or `types` subpath.
- AC3: The leaf and consuming app build for web, iOS, and Android, including the Android Compose compiler and Material 3 setup for the generated `date-picker` AAR.
- AC4: Maintained platform-specific examples demonstrate date selection through each component's public callback.

## Documentation

- AC1: [Install and import](../docs/date-picker.md#install-and-import) and maintained target-specific examples in `packages/demos/src/NativeDatePickerDemo.*.tsrx`. Public JSX imports are checked by the [packed consumer](../packages/date-picker/tests/packed-consumer.mjs).
- AC2: [Platform APIs](../docs/date-picker.md#platform-apis).
- AC3: [Platform adapters and build requirements](../docs/date-picker.md#install-and-import).
- AC4: [iOS example](../packages/demos/src/NativeDatePickerDemo.ios.tsrx), [Android example](../packages/demos/src/NativeDatePickerDemo.android.tsrx), [web example](../packages/demos/src/NativeDatePickerDemo.web.tsrx), and [macOS example](../packages/demos/src/NativeDatePickerDemo.macos.tsrx).
