# Add a platform-native single-selection picker

ID: native-picker
Targets: web, ios, android
Related APIs: @octane-xplat/picker, SwiftUIPicker, MaterialDropdown, Select

## Starting point

A scaffolded Octane Xplat app with web, iOS, and Android targets. The reader can
add a workspace or published package and place platform-specific imports behind
the established file suffixes.

## Requirements

- Present single selection through a SwiftUI menu picker on iOS, a Compose Material 3 dropdown on Android, and a browser select on web.
- Keep each platform's component name, option shape, selection state, and callback contract explicit.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import `SwiftUIPicker`, `MaterialDropdown`, and `Select` from matching target-suffixed modules without runtime platform branching.
- AC2: Documentation gives each platform component its own option and selection contract and does not expose a shared picker component or `types` subpath.
- AC3: The leaf and consuming app build for web, iOS, and Android, including the Android Compose compiler and Material 3 setup.
- AC4: Maintained platform-specific examples demonstrate the selection workflow through each component's public callback.
- AC5: Documentation states the pilot's boundaries and identifies the evidence needed before creating broader SwiftUI or Compose packages.

## Documentation

- AC1: [Install and import](../docs/platform/native-picker.md#install-and-import) and maintained target-specific examples in `packages/demos/src/NativePickerDemo.*.tsrx`. Public JSX imports are checked by the [packed consumer](../packages/picker/tests/packed-consumer.mjs).
- AC2: [Platform APIs](../docs/platform/native-picker.md#platform-apis).
- AC3: [Platform adapters and build requirements](../docs/platform/native-picker.md#install-and-import).
- AC4: [iOS example](../packages/demos/src/NativePickerDemo.ios.tsrx), [Android example](../packages/demos/src/NativePickerDemo.android.tsrx), and [web example](../packages/demos/src/NativePickerDemo.web.tsrx).
- AC5: [Pilot boundaries and package decision evidence](../docs/platform/native-picker.md#why-a-leaf-package).
