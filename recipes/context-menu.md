# Add a platform-native context menu to an octane subtree

ID: context-menu
Targets: web, ios, android
Related APIs: @octane-xplat/context-menu, SwiftUIContextMenu, MaterialContextMenu, ContextMenu

## Starting point

A scaffolded Octane xplat app with web, iOS, and Android targets. The reader
can add a workspace or published package and place platform-specific imports
behind the established file suffixes.

## Requirements

- Present a context menu through a SwiftUI `.contextMenu` on iOS, a Compose Material 3 `DropdownMenu` on Android, and an in-page right-click menu on web.
- Host the menu's trigger as an octane subtree rendered via a `trigger` render fn (detached root embedded in the native view hierarchy).
- Carry menu content as serialized item data (`id`, `title`, `destructive`, `disabled`, `divider`) and report picks through `onItemSelected(id)`.
- Keep SwiftUI and Compose bridge dependencies in an optional leaf package rather than `@octane-xplat/ui`.

## Acceptance criteria

- AC1: An app can install the leaf and import `SwiftUIContextMenu`, `MaterialContextMenu`, and `ContextMenu` from matching target-suffixed modules without runtime platform branching.
- AC2: Documentation states that the trigger is a render fn mounted into a detached root, explains the activation model per platform, and does not expose a shared context-menu component or `types` subpath.
- AC3: The leaf and consuming app build for web, iOS, and Android, including the Android Compose compiler and Material 3 setup for the generated `context-menu` AAR.
- AC4: Maintained platform-specific examples demonstrate a hosted trigger, a data-driven item list, and item selection through `onItemSelected`.

## Documentation

- AC1: [Install and import](../docs/context-menu.md#install-and-import) and maintained target-specific examples in `packages/demos/src/NativeContextMenuDemo.*.tsrx`.
- AC2: [The trigger is a render fn](../docs/context-menu.md#the-trigger-is-a-render-fn) and [Platform behavior](../docs/context-menu.md#platform-behavior).
- AC3: [Install and import](../docs/context-menu.md#install-and-import).
- AC4: [iOS example](../packages/demos/src/NativeContextMenuDemo.ios.tsrx), [Android example](../packages/demos/src/NativeContextMenuDemo.android.tsrx), and [web example](../packages/demos/src/NativeContextMenuDemo.web.tsrx).
