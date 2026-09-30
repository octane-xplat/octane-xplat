# `@octane-xplat/sheet`

An install boundary for platform-specific modal bottom sheets: a SwiftUI
`.sheet` presentation on iOS, a Material 3 `ModalBottomSheet` on Android,
a fixed-position DOM panel on web, and a real `NSWindow` sheet
(`beginSheet`) on macOS.

Install the package in the app that renders a control. Import
`SwiftUIBottomSheet` from `@octane-xplat/sheet/ios`,
`MaterialBottomSheet` from `@octane-xplat/sheet/android`, `BottomSheet`
from `@octane-xplat/sheet/web`, or `AppKitSheet` from
`@octane-xplat/sheet/macos` in the matching platform-suffixed file.
There is no shared sheet API at the package root.

Sheet content is a render fn whose octane output mounts into a detached
root — the same embedding mechanism as `@octane-xplat/context-menu`'s
trigger. On iOS the registered view resolves through
`NativeScriptViewFactory`; on Android through the leaf's
`XplatViewRegistry` + `AndroidView` inside the sheet's dialog window.

- iOS: `open` (controlled `isPresented`), `onDismissed`,
  `onPresentedChange`, `fitToContents` (ported size-reader →
  `.presentationDetents([.height])`), `detents`
  (`medium`/`large`/`fraction`/`height`), `showDragIndicator`,
  `interactiveDismissDisabled`.
- Android: `open` + `onDismissed`, `skipPartiallyExpanded` (the M3 detent
  model: partial vs fully expanded), `showDragHandle`,
  `sheetGesturesEnabled`, `shouldDismissOnBackPress`,
  `shouldDismissOnClickOutside`, and `containerColor`/`contentColor`/
  `scrimColor` hex strings. Activity-owned key events are forwarded while
  the sheet's dialog is open (ported from Expo).
- Web: scrim + bottom panel, scrim-click dismiss.

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/BottomSheetView.swift` and
`android/.../ui/ModalBottomSheetView.kt`. Attribution headers sit on the
ported files.
