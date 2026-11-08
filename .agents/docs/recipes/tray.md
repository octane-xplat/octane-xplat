# Add a persistent tray icon on desktop

ID: tray
Targets: macos, linux, windows
Related APIs: @octane-xplat/tray, createTray, getTrayAvailability, Tray, TrayMenuItem, TrayIcon, keepAppResident, showAppWindows, hideAppWindows, toggleAppWindows, areAppWindowsVisible

## Starting point

A running experimental desktop host (AppKit, GTK4, or pinned NativeScript WinUI) whose app needs a
persistent icon in the system status area — not an in-window DropdownMenu/ContextMenu and not the
application menu bar.

## Requirements

Check `getTrayAvailability` before creating, supply an icon resolvable on every target host, build a
menu from action/checkbox/radio-group/submenu/section/separator rows, keep checkbox and radio state
controlled through `update`, remove the item with `destroy`, and keep the app resident without
visible windows when intended.

## Acceptance criteria

- AC1: Call `getTrayAvailability()` before `createTray`, catch `TrayError` codes (`unsupported-platform`, `unsupported-runtime`, `no-session-bus`, `no-status-notifier-host`, `invalid-icon`, `invalid-menu`, `registration-failed`), and never create a second icon while one is live without an update/destroy path.
- AC2: Use per-platform `icon` overrides where formats differ (`isTemplate` file icon on macOS, `.ico` file icon on Windows, named/freedesktop icon on Linux) — a single named icon works only when the name resolves on the current host.
- AC3: Treat checkboxes and radio groups as controlled (the mark moves only through `update`), use `onActivate` for primary click and the menu for secondary click; on Windows use `&`-mnemonic labels where keyboard menu navigation matters.
- AC4: Use `showAppWindows`/`hideAppWindows`/`toggleAppWindows`/`areAppWindowsVisible` for resident-app window control and `keepAppResident` for the no-visible-window lifetime — on Windows the hold is inert and `hideWindowsOnClose` is unimplemented; on macOS a delegate that still ends the app on last-window-close makes it throw `resident-conflict`.
- AC5: Runtime evidence distinguishes real icon presence from handler dispatch — prove the notification-area/status-bar item out of process (`Shell_NotifyIconGetRect` rect, System Events, D-Bus watcher registration), not just that `createTray` resolved.

## Documentation

- AC1: [Check support first](../../../docs/packages/package-tray.md#check-support-first), [shared unsupported tests](../../../packages/tray/tests/unsupported.test.ts).
- AC2: [Pick the icon](../../../docs/packages/package-tray.md#pick-the-icon), [platform table](../../../docs/packages/package-tray.md#platform-support-and-limits).
- AC3: [Build the menu](../../../docs/packages/package-tray.md#build-the-menu), [react to clicks](../../../docs/packages/package-tray.md#react-to-clicks), [update and clean up](../../../docs/packages/package-tray.md#update-and-clean-up), [menu normalization tests](../../../packages/tray/tests/shared.test.ts).
- AC4: [Keep the app resident](../../../docs/packages/package-tray.md#keep-the-app-resident), [macOS runtime driver](../../../packages/tray/tests/appkit-runtime.mjs), [GTK residency fixture](../../../packages/tray/tests/fixtures/tray-window.gtk.js), [Windows host note](../../../docs/packages/package-tray.md#platform-support-and-limits).
- AC5: [What has been tested](../../../docs/packages/package-tray.md#what-has-been-tested), [packaged macOS driver](../../../packages/tray/tests/macos-packaged.mjs), [GTK runtime driver](../../../packages/tray/tests/gtk-runtime.mjs), [Windows runtime driver](../../../packages/tray/tests/windows-runtime.mjs).
