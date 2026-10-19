# Present an octane subtree in a platform-native sheet

ID: sheet
Targets: web, ios, android, macos
Related APIs: @octane-xplat/sheet, SwiftUIBottomSheet, MaterialBottomSheet, AppKitSheet, BottomSheet

## Starting point

A scaffolded Octane Xplat app with web, iOS, and Android targets. The reader
can add a workspace or published package and place platform-specific imports
behind the established file suffixes.

## Requirements

- Present a modal sheet through a SwiftUI `.sheet` on iOS, a Compose Material 3 `ModalBottomSheet` on Android, a native modal `<dialog>` on web, and an AppKit `NSWindow` sheet on macOS.
- Host the sheet's content through a `content` render fn; iOS, Android, and macOS portal it from its declaring Octane tree and retain context across the native sheet boundary.
- Keep `open` controlled with `onDismissed` reporting platform-side dismissal; keep detent/drag-handle styling in each platform's own terms.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import `SwiftUIBottomSheet`, `MaterialBottomSheet`, `BottomSheet`, and `AppKitSheet` from matching target-suffixed modules without runtime platform branching.
- AC2: Documentation states that iOS, Android, and macOS portal `content` from the declaring tree and retain context, explains controlled `open` + `onDismissed`, and does not expose a shared sheet component or `types` subpath.
- AC3: The leaf and consuming app build for web, iOS, Android, and macOS, including the Android Compose compiler and Material 3 setup for the generated `sheet` AAR and metadata regeneration for new `com.` packages.
- AC4: Maintained platform-specific examples demonstrate a hosted content subtree and close-from-inside + outside-dismiss behavior.

- AC5: Modal keyboard focus stays in the presented content and returns to the trigger on dismissal; native VoiceOver/TalkBack navigation is qualified separately from view-tree mappings.

- AC6: With an already-open phone keyboard, hosted input keeps usable bounds
  and clears the keyboard through native detent/presentation changes. The
  dismissal callback can explicitly restore the app-owned editing target.
  Native presentation owns window avoidance; frame/OS-input limits are explicit.

## Documentation

- AC1: [Install and import](../../../docs/platform/sheet.md#install-and-import) and maintained target-specific examples in `packages/demos/src/NativeSheetDemo.*.tsrx`. Public JSX imports are checked by the [packed consumer](../../../packages/sheet/tests/packed-consumer.mjs).
- AC2: [Content is a render fn](../../../docs/platform/sheet.md#content-is-a-render-fn) and [Open state is controlled](../../../docs/platform/sheet.md#open-state-is-controlled).
- AC3: [Install and import](../../../docs/platform/sheet.md#install-and-import) and [Bridge notes](../../../docs/platform/sheet.md#bridge-notes--what-this-leaf-proved).
- AC4: [iOS example](../../../packages/demos/src/NativeSheetDemo.ios.tsrx), [Android example](../../../packages/demos/src/NativeSheetDemo.android.tsrx), [web example](../../../packages/demos/src/NativeSheetDemo.web.tsrx), and [macOS example](../../../packages/demos/src/NativeSheetDemo.macos.tsrx).

- AC5: [Focus qualification](../../../docs/platform/sheet.md#focus-qualification), the maintained [web sheet runtime check](../../../apps/web/scripts/sheet-readiness.ts), and [input readiness evidence](../notes/input-readiness-notes.md). Native VoiceOver/TalkBack qualification remains an explicit native follow-up.

- AC6: [Return to editing](../../../docs/platform/sheet.md#return-to-editing-after-closing), maintained [iOS demo](../../../packages/demos/src/NativeSheetDemo.ios.tsrx), [Android demo](../../../packages/demos/src/NativeSheetDemo.android.tsrx), and the [keyboard qualification note](../keyboard.md#native-overlay-transform-ownership). Maintained [SwiftUI](../../../packages/sheet/tests/fixtures/keyboard.ios.tsrx) and [Compose](../../../packages/sheet/tests/fixtures/keyboard.android.tsrx) journeys check hosted input geometry and explicit editing return. Compose additionally checks fresh window state across repeated presentation. These do not establish physical keyboard or screen-reader behavior.

[Final keyboard qualification](../keyboard.md#final-workflow-qualification) separates
OS touch/typing in shared overlays from programmatic native-sheet, desktop, and
browser evidence. Physical keyboard and screen-reader navigation are not implied.
