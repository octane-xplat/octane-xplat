# Add portable date and file inputs

ID: date-picker
Targets: web, ios, android, macos, linux
Related APIs: Calendar, DateInput, TimeInput, DateTimeInput, DateRangeInput, FileInput, @octane-xplat/files, @octane-xplat/date-picker

## Starting point

An Octane xplat app with `@octane-xplat/ui` and `@octane-xplat/files` installed. Add the optional
`@octane-xplat/date-picker` leaf only when the product needs SwiftUI, Material
3, or AppKit picker chrome instead of the shared picker surfaces.

## Requirements

Choose from a single date, time, combined date-time, date range, calendar, or
file workflow. Keep date values as portable ISO strings and use the file
picker bundled with `@octane-xplat/files`.

## Acceptance criteria

- AC1: Date controls are exported from `@octane-xplat/ui` and `FileInput` from `@octane-xplat/files`, with the same public prop names and types on every target.
- AC2: Date, time, date-time, and inclusive range values follow documented zone-free ISO contracts; date bounds and constraints apply on web and native surfaces, including range presets. Parent values remain authoritative after commits, resets, corrections, and rejected saves.
- AC3: `FileInput` supports `accept`, `isMultiple`, `maxSize`, `maxFiles`, clear/remove, and dropzone behavior where pointer drag/drop exists; its portable file reference and web `File` adaptation are documented.
- AC4: `FileInput` opens the browser, NativeScript, or AppKit picker by default; iOS and Android multi-file selection needs no app-owned adapter.
- AC5: Apps that need OS-authentic controls can use the iOS, Android, or macOS leaf entry. The obsolete `@octane-xplat/date-picker/web` `DateInput` contract is removed in favor of `@octane-xplat/ui`.
- AC6: Maintained examples and focused tests/typechecks cover the shared API and native leaf boundary without visual inspection or device launch.

- AC7: Shared web date controls support enabled-cell keyboard focus, RTL calendar navigation, IME-safe text commits, and bounded time-option navigation. Apps can supply locale and translated state messages on all targets; unsupported native key/accessibility delivery is explicit.

## Documentation

- AC1: [Portable component list](../docs/app/components.md#inputs) and [shared platform contract](../docs/platform/date-picker.md#portable-values).
- AC2: [ISO values and picker surfaces](../docs/platform/date-picker.md#portable-values).
- AC3: [File reference and validation behavior](../docs/platform/date-picker.md#portable-values), the [maintained gallery example](../packages/demos/src/FileInputDemo.tsrx), the [web interaction tests](../packages/files/src/FileInput.web.test.tsx), and the [file validation tests](../packages/files/src/file-input-utils.ts).
- AC4: [Built-in picker defaults and host coverage](../docs/platform/date-picker.md#portable-values).
- AC5: [OS-authentic picker entries](../docs/platform/date-picker.md#os-authentic-pickers) and [platform APIs](../docs/platform/date-picker.md#platform-apis).
- AC6: [web shared-control example](../packages/demos/src/NativeDatePickerDemo.web.tsrx), [iOS example](../packages/demos/src/NativeDatePickerDemo.ios.tsrx), [Android example](../packages/demos/src/NativeDatePickerDemo.android.tsrx), [macOS host note](../packages/demos/src/NativeDatePickerDemo.macos.tsrx), and targeted typegen/tests.

- AC7: [Keyboard and app language](../docs/date-picker.md#keyboard-and-app-language), the [web demo](../packages/demos/src/NativeDatePickerDemo.web.tsrx), and [keyboard regressions](../packages/ui/src/date-entry.web.test.tsx).
