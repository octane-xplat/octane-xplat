# Add a platform-native single-selection picker

ID: native-picker
Targets: web, ios, android
Related APIs: @octane-xplat/native-picker, NativePicker, NativePickerProps, NativePickerOption

## Starting point

A scaffolded Octane xplat app with web, iOS, and Android targets. The reader can
add a workspace or published package and place platform-specific imports behind
the established file suffixes.

## Requirements

- Present a single selection with a menu-style native control on iOS and Android and a browser select on web.
- Keep a shared string value and callback contract across all targets.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import the matching iOS, Android, and web component from target-suffixed modules without runtime platform branching.
- AC2: Controlled and uncontrolled selection, option disabling, whole-control disabling, and accessible labeling have the same documented prop contract on web, iOS, and Android.
- AC3: The leaf and consuming app build for web, iOS, and Android, including the Android Compose compiler and Material 3 setup.
- AC4: A maintained example demonstrates a real selection workflow and records selected values through the public callback on all three targets.
- AC5: Documentation states the pilot's boundaries and identifies the evidence needed before creating broader SwiftUI or Compose packages.

## Documentation

- AC1: [Install and import](../docs/native-picker.md#install-and-import) and [maintained target-specific imports](../packages/demos/src/NativePickerDemo.tsrx).
- AC2: [Value and option contract](../docs/native-picker.md#value-and-option-contract).
- AC3: [Platform adapters and build requirements](../docs/native-picker.md#install-and-import).
- AC4: [Maintained picker demo](../packages/demos/src/NativePickerDemo.tsrx), with [iOS](../packages/demos/src/nativePickerControl.ios.ts), [Android](../packages/demos/src/nativePickerControl.android.ts), and [web](../packages/demos/src/nativePickerControl.web.ts) imports.
- AC5: [Pilot boundaries and package decision evidence](../docs/native-picker.md#why-a-leaf-package).
