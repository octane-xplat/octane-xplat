# System tray host boundaries

`@octane-xplat/tray` is an optional leaf owning the OS tray/status-bar
surface. It is not the in-window menu family (`DropdownMenu`/`ContextMenu`
in ui) and not the application menu bar (`@octane-xplat/app-menu` owns
`NSApp.mainMenu` and the `Gtk.Application` menubar — ownership was
coordinated with that task; the leaves share `MenuOption`-compatible row
shapes but no code). The public guide is
[System tray](../../docs/packages/package-tray.md).

## Shared model

`createTray` validates options through `normalizeTrayOptions` and builds a
menu model (`buildMenuModel`) that assigns stable command ids per row.
`TrayMenuItem` is field-compatible with ui `MenuOption` data rows so one
definition drives the tray and in-app menus — keep it a data shape, never a
component. Unsupported leaves (web, iOS, Android) report
`unsupported-platform` from `getTrayAvailability` and reject `createTray`;
window helpers are inert there except where the platform leaf requires its
own runtime (Windows throws `unsupported-runtime` via `requireWin32`).

## AppKit host

`src/index.macos.ts` uses `NSStatusBar.systemStatusBar.statusItemWithLength`
through `@octane-xplat/platform/macos`; `id` sets `autosaveName` for
persistent ordering. The item's `NSStatusItemButton` gets the image/title/
tooltip, a bound action target for primary activation, and `NSMenu` for the
secondary surface. Checkbox/radio state is controlled — native state moves
only on `update`. `keepAppResident` toggles `NSApplication` activation
policy and `hideWindowsOnClose` hooks the app's window-close path; a
delegate that already ends the app on last-window-close makes it throw
`resident-conflict`. macOS file icons accept `isTemplate`.

## GTK host

`src/index.gtk.ts` speaks `org.kde.StatusNotifierItem` over the session bus
in pure Gio — no appindicator typelibs. The menu is exported on
`com.canonical.dbusmenu`; sections and radio groups get separator+header
rows around them (the dbusmenu convention — the emitted top-level row count
exceeds the authored row count). File icons send ARGB pixmaps converted
from PNG; named icons go through `IconName`. Availability is
`no-session-bus` then `no-status-notifier-host`; the watcher check must run
in its own GJS context — synchronous `Properties.Get` against a watcher
exported in the same process deadlocks (the test fixture keeps the watcher
in a spawned `gjs` child for that reason). Watcher restart re-registers
live items. `keepAppResident` holds the `Gtk.Application` with
`Gio.Application.hold`.

## Windows host

`src/index.windows.ts` requires `NSWinRT.win32.call` plus
`interop.pointerFromBuffer`; `requireWin32` throws `unsupported-runtime`
without them (helpers as well as `createTray`). An eval `Worker` owns a
message-only window (registered `DefWindowProcW` class, `HWND_MESSAGE`
parent passed as `i64` — a signed `i32` truncates and yields hwnd 0) and
the `Shell_NotifyIconW` lifecycle; `Shell_NotifyIconGetRect` with a 40-byte
`NOTIFYICONIDENTIFIER` reports the real notification-area rect. The context
menu is a `TrackPopupMenu` built from the same render model; `&` marks
mnemonics.

IPC is file-based, not `Worker.postMessage`: posts into the worker are
dropped while it is blocked, and its own posts never flush once the pump
blocks. Commands ride append-only JSONL files in `%TEMP%` plus a
`PostThreadMessageW` wakeup, and events come back the same way — the main
side polls the event file on a 150 ms timer. `drainCommands` runs every
loop iteration because `TrackPopupMenu`'s modal pump eats thread-queue
wakeups. File opens must use `FILE_SHARE_READ|WRITE` (share mode 3) in both
directions — a `FILE_SHARE_READ`-only read handle denies the peer's appends;
and `INVALID_HANDLE_VALUE` (0xFFFFFFFFFFFFFFFF) must be checked as
`h > 0x80000000`, not `h === -1` — JS cannot represent the raw value, so an
exact `-1` compare silently passes the invalid handle into later calls.
Commands issued while a menu is open are serviced after the popup closes.

Window helpers enumerate the process's top-level windows via
`GetTopWindow`/`GetWindow(GW_HWNDNEXT)` + `IsWindowVisible` — no callbacks
needed. `keepAppResident` is an inert hold: the packaged host keeps the
process alive while JS runs and there is no last-window-close lifetime to
hook from JS; `hideWindowsOnClose` is unimplemented. Visibility
enumeration sees the WinUI window only intermittently — hide/show/toggle
themselves work.

The runtime driver `tests/windows-runtime.mts` needs a signed-in Windows
host (`TRAY_WINDOWS_HOST`, `TRAY_WINDOWS_RUNTIME`); it stages the app,
registers the package through an interactive scheduled task (Add-AppxPackage
is denied from session 0), and launches via `explorer.exe shell:AppsFolder`.
Session-1 task startup can stall under disk pressure — free space first.
The fixture's `probeRect`/`probeInput` leaf seams inject synthetic clicks
and keys through the real queue; they are test-only and not part of the
public API.
