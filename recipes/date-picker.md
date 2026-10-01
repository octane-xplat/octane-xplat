# Add portable date and file inputs

ID: date-picker
Targets: web, ios, android, macos, linux
Related APIs: Calendar, DateInput, TimeInput, DateTimeInput, DateRangeInput, FileInput, registerFilePicker, @octane-xplat/date-picker

## Starting point

An Octane xplat app with `@octane-xplat/ui` installed. Add the optional
`@octane-xplat/date-picker` leaf only when the product needs SwiftUI, Material
3, or AppKit picker chrome instead of the shared picker surfaces.

## Requirements

Choose from a single date, time, combined date-time, date range, calendar, or
file workflow. Keep date values portable ISO strings and keep native file
picking behind an app-owned provider.

## Acceptance criteria

- AC1: `Calendar`, `DateInput`, `TimeInput`, `DateTimeInput`, `DateRangeInput`, and `FileInput` are exported from the shared UI entry with the same public prop names and types on every target.
- AC2: Date, time, date-time, and inclusive range values follow documented zone-free ISO contracts; date bounds and constraints apply on web and native surfaces.
- AC3: `FileInput` supports `accept`, `isMultiple`, `maxSize`, `maxFiles`, clear/remove, and dropzone behavior where pointer drag/drop exists; its portable file reference and web `File` adaptation are documented.
- AC4: Native apps can register a file picker without adding a UI dependency; unsupported hosts are explicitly documented.
- AC5: Apps that need OS-authentic controls can use the iOS, Android, or macOS leaf entry. The obsolete `@octane-xplat/date-picker/web` `DateInput` contract is removed in favor of `@octane-xplat/ui`.
- AC6: Maintained examples and focused tests/typechecks cover the shared API and native leaf boundary without visual inspection or device launch.

## Documentation

- AC1: [Portable component list](../docs/components.md#inputs) and [shared platform contract](../docs/date-picker.md#portable-values).
- AC2: [ISO values and picker surfaces](../docs/date-picker.md#portable-values).
- AC3: [File reference and validation behavior](../docs/date-picker.md#portable-values), the [web interaction tests](../packages/ui/src/date-entry.test.tsx), and the [file validation tests](../packages/ui/src/datetime.test.ts).
- AC4: [Native picker registration and host coverage](../docs/date-picker.md#portable-values).
- AC5: [OS-authentic picker entries](../docs/date-picker.md#os-authentic-pickers) and [platform APIs](../docs/date-picker.md#platform-apis).
- AC6: [web shared-control example](../packages/demos/src/NativeDatePickerDemo.web.tsrx), [iOS example](../packages/demos/src/NativeDatePickerDemo.ios.tsrx), [Android example](../packages/demos/src/NativeDatePickerDemo.android.tsrx), [macOS host note](../packages/demos/src/NativeDatePickerDemo.macos.tsrx), and targeted typegen/tests.
