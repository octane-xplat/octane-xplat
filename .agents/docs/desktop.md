# Desktop service ownership

`packages/desktop` publishes `@octane-xplat/desktop` with one public root export. It replaces the former app-menu, tray and global-shortcuts packages without aliases or forwarding packages. The [public package guide](../../docs/packages/package-desktop.md) owns consumer setup; feature guides retain their task-specific explanations.

## Internal boundaries

- `src/app/` owns app readiness, quit, residency, and app-wide window visibility. The AppKit delegate and GTK host check app and window vetoes before closing managed windows. AppKit restarts the approved native termination after closing windows, so closed notifications can run before the process exits. GTK routes the framework menu role through the same quit path. These operations do not require a tray item. Their existing `TrayError` failure contract is retained.
- `src/window/` owns regular secondary window handles and close events. AppKit uses `performClose` and GTK uses `Gtk.Window.close` so calls reach the same veto as native close controls. The host controller owns content and forced teardown.
- Per-window visibility reads the native shown state. `show()` presents the existing window and requests focus. `focus()` only requests focus for a shown window, leaving keyboard focus policy to the desktop environment. Hiding never dispatches close or retires the content root.
- `src/dialog/` resolves a shown `DesktopWindow` through its host's private window binding. AppKit attaches a sheet and GTK uses a modal native file chooser. The pinned Windows App SDK predates the newer window-ID picker constructor. Its managed bridge resolves the owner's HWND from the WinUI window ID and initializes the picker with that HWND. The bridge ships as C# source compiled into the consuming Windows app. It queues the picker on the WinUI dispatcher so returning from the bridge leaves the message pump free.
- `src/windows-host.windows.ts` uses the pinned NativeScript Windows Core resolver to capture the `NativeWindow` for each synchronous `Application.openWindow` call. If WinUI has yet to expose `XamlRoot`, apply the requested client size when the native content loads and exposes its display scale. WinUI `AppWindow.Closing` supports cancellation through `args.Cancel`. The adapter checks the same JavaScript guard before a programmatic `Window.Close()` because that route can bypass `Closing`. Readiness waits for the primary root to load. Quit checks app and window vetoes before closing managed secondaries, then waits for their completion before closing the primary. Quit requires all secondary windows to be managed by this adapter.
- `src/menu/` owns the native application menu bar; see [menu host boundaries](app-menu.md).
- `src/tray/` owns status/tray icons and their menus; see [tray host boundaries](tray.md).
- `src/shortcuts/` owns process-shared system-wide hotkey registration. It remains distinct from the focused keyboard-command package `@octane-xplat/shortcuts`.
- `src/windows-interop.ts` supplies inert Win32 projection primitives used by app and tray modules.

Each root platform entry explicitly selects the matching internal entries. Root imports must not install a menu, create an icon, register a hotkey, acquire app residency, or register native callback classes. The macOS tray action class is defined and registered lazily on first tray creation. Retain the existing platform capability checks and disposal contracts; a shared package does not imply shared platform support.

Portable files, clipboard, appearance and notifications remain in their owning service packages. Renderers and build tooling retain separate installation boundaries. Additional app, shell, display and dialog APIs belong here when implemented; do not export placeholders or claim Electron compatibility from similar names.

## Verification

Unit coverage lives under `tests/menu`, `tests/tray`, and `tests/shortcuts`; root-import coverage lives in `tests/root-import.test.ts`. `test:packed` checks each feature through the one packed root with ambient-free declarations and native export precedence. Native runtime tasks are feature-qualified (`test:menu-*`, `test:tray-*`, `test:shortcuts-*`) to preserve independent resource ownership and evidence. Runtime runners must import the combined root so integration issues cannot hide behind internal entry points. Native OS behavior still needs its maintained host tests; a package build or mocked unit suite does not establish input, packaging, or platform parity.

Window runtime fixtures import the package root and exercise the same close and disposal assertions on the AppKit and GTK hosts. See [package verification](package-verification.md#desktop-windows) for the runners.
