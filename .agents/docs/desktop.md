# Desktop service ownership

`packages/desktop` publishes `@octane-xplat/desktop` with one public root export. It replaces the former app-menu, tray and global-shortcuts packages without aliases or forwarding packages. The [public package guide](../../docs/packages/package-desktop.md) owns consumer setup; feature guides retain their task-specific explanations.

## Internal boundaries

- `src/app/` owns app residency and app-wide window visibility. These operations do not require a tray item. Their existing `TrayError` failure contract is retained.
- `src/window/` owns secondary window handles and close events. AppKit uses `performClose` and GTK uses `Gtk.Window.close` so calls reach the same veto as native close controls. The host controller owns content and forced teardown. Only regular windows are exposed: sheet and popup behavior differs between hosts, and the Windows host currently provides an asynchronous open request without a qualified per-window close veto.
- `src/menu/` owns the native application menu bar; see [menu host boundaries](app-menu.md).
- `src/tray/` owns status/tray icons and their menus; see [tray host boundaries](tray.md).
- `src/shortcuts/` owns process-shared system-wide hotkey registration. It remains distinct from the focused keyboard-command package `@octane-xplat/shortcuts`.
- `src/windows-interop.ts` supplies inert Win32 projection primitives used by app and tray modules.

Each root platform entry explicitly selects the matching internal entries. Root imports must not install a menu, create an icon, register a hotkey, acquire app residency, or register native callback classes. The macOS tray action class is defined and registered lazily on first tray creation. Retain the existing platform capability checks and disposal contracts; a shared package does not imply shared platform support.

Portable files, clipboard, appearance and notifications remain in their owning service packages. Renderers and build tooling retain separate installation boundaries. Additional app, shell, display and dialog APIs belong here when implemented; do not export placeholders or claim Electron compatibility from similar names.

## Verification

Unit coverage lives under `tests/menu`, `tests/tray`, and `tests/shortcuts`; root-import coverage lives in `tests/root-import.test.ts`. `test:packed` checks each feature through the one packed root with ambient-free declarations and native export precedence. Native runtime tasks are feature-qualified (`test:menu-*`, `test:tray-*`, `test:shortcuts-*`) to preserve independent resource ownership and evidence. Runtime runners must import the combined root so integration issues cannot hide behind internal entry points. Native OS behavior still needs its maintained host tests; a package build or mocked unit suite does not establish input, packaging, or platform parity.

Window runtime fixtures import the package root and exercise the same close and disposal assertions on the AppKit and GTK hosts. See [package verification](package-verification.md#desktop-windows) for the runners.
