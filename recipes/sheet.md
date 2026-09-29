# Present an octane subtree in a platform-native bottom sheet

ID: sheet
Targets: web, ios, android
Related APIs: @octane-xplat/sheet, SwiftUIBottomSheet, MaterialBottomSheet, BottomSheet

## Starting point

A scaffolded Octane xplat app with web, iOS, and Android targets. The reader
can add a workspace or published package and place platform-specific imports
behind the established file suffixes.

## Requirements

- Present a modal bottom sheet through a SwiftUI `.sheet` on iOS, a Compose Material 3 `ModalBottomSheet` on Android, and a DOM scrim + panel on web.
- Host the sheet's content as an octane subtree rendered via a `content` render fn (detached root embedded across the modal's window boundary).
- Keep `open` controlled with `onDismissed` reporting platform-side dismissal; keep detent/drag-handle styling in each platform's own terms.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import `SwiftUIBottomSheet`, `MaterialBottomSheet`, and `BottomSheet` from matching target-suffixed modules without runtime platform branching.
- AC2: Documentation states that `content` is a render fn mounted into a detached root hosted across the modal window boundary, explains controlled `open` + `onDismissed`, and does not expose a shared sheet component or `types` subpath.
- AC3: The leaf and consuming app build for web, iOS, and Android, including the Android Compose compiler and Material 3 setup for the generated `sheet` AAR and metadata regeneration for new `com.` packages.
- AC4: Maintained platform-specific examples demonstrate a hosted content subtree and close-from-inside + outside-dismiss behavior.

## Documentation

- AC1: [Install and import](../docs/sheet.md#install-and-import) and maintained target-specific examples in `packages/demos/src/NativeSheetDemo.*.tsrx`.
- AC2: [Content is a render fn](../docs/sheet.md#content-is-a-render-fn) and [Open state is controlled](../docs/sheet.md#open-state-is-controlled).
- AC3: [Install and import](../docs/sheet.md#install-and-import) and [Bridge notes](../docs/sheet.md#bridge-notes--what-this-leaf-proved).
- AC4: [iOS example](../packages/demos/src/NativeSheetDemo.ios.tsrx), [Android example](../packages/demos/src/NativeSheetDemo.android.tsrx), and [web example](../packages/demos/src/NativeSheetDemo.web.tsrx).
