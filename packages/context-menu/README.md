# `@octane-xplat/context-menu`

An install boundary for platform-specific context menus: a SwiftUI
`.contextMenu` on iOS, a Material 3 `DropdownMenu` anchored to a hosted
trigger on Android, an in-page right-click menu on web, and a real
`NSMenu` on the backing view on macOS.

Install the package in the app that renders a control. Import
`SwiftUIContextMenu` from `@octane-xplat/context-menu/ios`,
`MaterialContextMenu` from `@octane-xplat/context-menu/android`,
`ContextMenu` from `@octane-xplat/context-menu/web`, or
`AppKitContextMenu` from `@octane-xplat/context-menu/macos` in the matching
platform-suffixed file. There is no shared context-menu API at the package
root.

Unlike props-only leaves (picker, date-picker), this leaf exercises subtree
embedding: `trigger` is a render fn whose octane output mounts into a
detached root, and the native menu wraps that subtree — SwiftUI resolves it
through `NativeScriptViewFactory` (the same factory the swift-ui plugin's
`NativeScriptView` uses), and Android through the leaf's
`XplatViewRegistry` + `AndroidView`. Menu items cross the bridge as
serialized data (`{id, title, destructive, disabled, divider}`), reported
back through `onItemSelected(id)`.

- iOS: long-press activation (platform native); optional `preview` render fn
  (iOS 16+).
- Android: `activation` prop — `'longPress'` (default) or `'singlePress'`,
  detected at parent level so interactive children in the trigger keep
  their own taps.
- Web: right-click (`longPress`) or click (`singlePress`) opens the menu at
  the pointer.
- macOS: right-click — the NSMenu is the view's `menu`, so AppKit owns
  activation and disabled-item dimming; the trigger renders inline.

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/ContextMenu/ContextMenu.swift` and
`android/.../ui/menu/DropdownMenu*.kt`. Attribution headers sit on the
ported files.
