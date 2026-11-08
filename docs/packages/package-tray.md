# System tray

> An icon beside the clock that stays reachable while your app keeps running

Give your desktop app a persistent icon in the macOS menu bar, the Windows
notification area, or a Linux tray area. People can click it to show or hide
your window, open a context menu, or trigger a quick action.

`@octane-xplat/tray` creates that icon on macOS, Linux, and Windows. It is a
different thing from the application menu bar owned by
[`@octane-xplat/app-menu`](package-app-menu.md) — the menu bar holds menus
like File and Edit at the top of the screen or window, while a tray icon lives
in the system status area beside the clock. It is also different from
`DropdownMenu` and `ContextMenu` in [`@octane-xplat/ui`](package-ui.md),
which draw menus inside your app's window.

[Generated API reference](https://octane-xplat.goddardai.org/api-tray).

## Install and try

After the package's first framework release, run this in your app directory.
Keep its version aligned with your other Xplat packages.

```sh
bun add @octane-xplat/tray
```

Check support, then create the tray item once. `createTray` returns a handle
you keep for the life of the icon.

```ts
import { createTray, getTrayAvailability } from '@octane-xplat/tray'

const availability = await getTrayAvailability()
if (availability.available) {
  const tray = await createTray({
    id: 'my-app',
    icon: { type: 'named', name: 'star' },
    tooltip: 'My App',
    menu: [
      { type: 'action', key: 'quit', label: 'Quit', onSelect: () => quit() },
    ],
  })
}
```

On macOS the icon appears in the menu bar; on Windows in the notification
area near the clock; on Linux wherever the desktop's StatusNotifier host
shows tray items.

## Check support first

Only desktop apps can own a tray icon. On web, iOS, and Android the package
still imports and `getTrayAvailability()` reports `available: false` with a
reason — `createTray` rejects with a `TrayError` carrying the same code, so
unsupported hosts fail visibly instead of silently doing nothing.

```ts
import { createTray, getTrayAvailability, TrayError } from '@octane-xplat/tray'

async function startTray() {
  const availability = await getTrayAvailability()
  if (!availability.available) {
    console.log(availability.reason, availability.message)
    return
  }
  try {
    await createTray(options)
  } catch (error) {
    if (error instanceof TrayError) console.log(error.code)
  }
}
```

Linux adds two conditions: the process must reach the D-Bus session bus
(`no-session-bus`), and a registered `org.kde.StatusNotifierWatcher` host must
exist (`no-status-notifier-host`). KDE, GNOME with an AppIndicator
extension, and similar desktops provide one; desktops without a tray host
report `available: false`.

Windows requires the packaged NativeScript Windows runtime's Win32
projection. Hosts that cannot expose it report `unsupported-runtime`.

## Pick the icon

Each tray item needs an icon. A `named` icon is resolved by the platform:
an SF Symbol or app icon on macOS, a freedesktop icon-theme name on Linux, a
stock icon name on Windows (`application`, `info`, `warning`, `error`,
`question`, `winlogo`, `shield`, or a numeric system id). A `file` icon
loads an image from an absolute path — PNG on macOS and Linux, `.ico`,
`.cur`, or `.ani` on Windows.

```ts
const tray = await createTray({
  id: 'my-app',
  icon: {
    macos: { type: 'file', path: '/Applications/MyApp.app/Contents/Resources/tray.png', isTemplate: true },
    linux: { type: 'named', name: 'star' },
    windows: { type: 'file', path: 'C:\\my-app\\tray.ico' },
  },
})
```

Supply per-platform overrides with the `macos`/`linux`/`windows` keys, or a
single icon for all platforms — a matching entry for the current platform is
required, so a `windows:`-only override rejects on other hosts with
`invalid-icon`. Set `isTemplate` on a macOS file icon for a monochrome image
that adapts to light and dark menu bars.

## Build the menu

Secondary click (right click, or Ctrl+click) opens the context menu. If you
leave `onActivate` unset, a primary click opens it too. Menu rows are the
same shape other Xplat menus accept: `action`, `checkbox`, `radio-group`,
`submenu`, `section`, and `separator`.

```ts
const tray = await createTray({
  id: 'my-app',
  icon: { type: 'named', name: 'star' },
  menu: [
    { type: 'action', key: 'show', label: 'Show Window', onSelect: showAppWindows },
    {
      type: 'checkbox',
      key: 'sync',
      label: 'Sync enabled',
      value: syncEnabled,
      onValueChange: (next) => setSync(next),
    },
    { type: 'separator', key: 'sep' },
    { type: 'action', key: 'quit', label: 'Quit', onSelect: quit },
  ],
})
```

A `checkbox` is controlled: `onValueChange` reports the value the person
asked for, and the check mark only moves after you send the new `value`
through `update()`. A `radio-group` reports the chosen option's `value`
(falling back to its `key`) the same way. `section` groups rows under a
heading, `submenu` nests rows, and `isDisabled` dims a row and blocks
selection.

`TrayMenuItem` is field-compatible with the `MenuOption` data rows accepted
by `DropdownMenu` and `ContextMenu` in `@octane-xplat/ui`, so one menu
definition can drive the tray and an in-app menu. It is not the
`@octane-xplat/app-menu` entry type — the application menu bar and the tray
are separate surfaces.

## React to clicks

Set `onActivate` for the primary-click action — typically showing or
toggling your window. With `onActivate` set, the menu only opens on
secondary click.

```ts
import { createTray, toggleAppWindows } from '@octane-xplat/tray'

const tray = await createTray({
  id: 'my-app',
  icon: { type: 'named', name: 'star' },
  tooltip: 'My App',
  onActivate: () => toggleAppWindows(),
})
```

On macOS, primary click runs `onActivate`; Ctrl+click or right click opens
the menu. On Windows and Linux the same split applies: primary activation
runs `onActivate` and secondary click opens the `TrackPopupMenu` or
StatusNotifier menu.

## Update and clean up

`update` applies partial changes — `undefined` leaves a field alone, `null`
clears it. Swap the tooltip after a state change, replace the icon, or
rebuild the menu; native items always run the callbacks from the latest
update.

```ts
tray.update({ tooltip: 'My App — 3 unread' })
tray.update({ menu: [{ type: 'action', key: 'quit', label: 'Quit', onSelect: quit }] })
```

`destroy` removes the icon and releases its native resources. It is
idempotent; `update` after `destroy` throws `TrayError('destroyed')`.

```ts
tray.destroy()
console.log(tray.isDestroyed) // true
```

## Keep the app resident

Tray apps usually stay alive without visible windows. The window helpers
control the app's top-level windows, and `keepAppResident` keeps the app
running after the last window closes.

```ts
import { hideAppWindows, keepAppResident, showAppWindows } from '@octane-xplat/tray'

const residency = keepAppResident({ hideWindowsOnClose: true })
// Later: showAppWindows() / residency.release()
```

`showAppWindows` shows the app's windows and focuses the first one,
`hideAppWindows` hides them all, `toggleAppWindows` flips between the two,
and `areAppWindowsVisible` reports current state. On macOS `keepAppResident`
switches `NSApplication` activation policy so the app can run as an
accessory; `hideWindowsOnClose` hides windows when the last one closes.
On Linux it holds the `Gtk.Application` alive with `Gio.Application.hold`.
On Windows the packaged host already keeps the process alive while JS runs,
so the hold is inert and `hideWindowsOnClose` is not implemented. Calling
`release` ends the hold. On web and mobile these helpers are inert no-ops
except `keepAppResident`, which throws on macOS when the app delegate still
ends the app on last-window-close (`resident-conflict`).

## Platform support and limits

Desktop hosts are experimental. This table describes what each one uses and
what it needs from you.

| Target | How it works | What to know |
| --- | --- | --- |
| macOS (AppKit host) | `NSStatusBar` status item with an `NSMenu` of `NSMenuItem`s. | `id` becomes the item's `autosaveName`, so its position persists. `title` draws text beside the icon. Template icons adapt to the menu bar style. Tooltips apply to the status item's button. |
| Linux (GTK4/GJS host) | `org.kde.StatusNotifierItem` over the D-Bus session bus, menu via `com.canonical.dbusmenu`. | Needs a session bus and a registered StatusNotifier watcher (KDE, GNOME + AppIndicator extension, or similar) or availability reports `no-session-bus`/`no-status-notifier-host`. Named icons resolve through `xdg-icon-resource`-style theme names; file icons send ARGB pixmaps. Re-registers automatically when the watcher restarts. |
| Windows (pinned NativeScript WinUI host) | `Shell_NotifyIconW` on a message-only window owned by a dedicated worker thread; `TrackPopupMenu` for the context menu. | Requires the packaged Windows runtime's `NSWinRT.win32` projection and pointer interop — hosts without it report `unsupported-runtime`. File icons must be `.ico`/`.cur`/`.ani`; named icons map to stock `LoadIconW` ids. `&` in labels marks menu mnemonics. Tooltip text is the notification-area balloon text. |
| Web, iOS, Android | None. | `available: false` with `unsupported-platform`; `createTray` rejects. |

## What has been tested

Verified on this release:

- **macOS:** a real packaged `.app` created, updated, and removed a
  `NSStatusItem`, with the item's presence cross-checked out of process.
  The JavaScriptCore host suite additionally covers menu dispatch,
  activation, template icons, and residency.
- **Linux:** a live D-Bus session bus with the StatusNotifier watcher
  running in a separate process verified registration, `GetAll`
  properties, the dbusmenu layout with every row kind, `Event` dispatch,
  PNG pixmap delivery, automatic re-registration on watcher restart, and
  `Gio.Application.hold` residency.
- **Windows:** the packaged host fixture verified the real
  notification-area rectangle via `Shell_NotifyIconGetRect`, activation
  through the real callback message, `TrackPopupMenu` selection on the
  initial and updated menus, update, and destroy. Pointer input was
  injected synthetically; physical mouse clicks and real user interaction
  remain unqualified.
- A packed-consumer test verifies the published package installs and all
  export conditions resolve.

Run the maintained runtime drivers against real hosts:

```sh
# Windows: signed-in host with the pinned NativeScript runtime built.
TRAY_WINDOWS_HOST=windy \
TRAY_WINDOWS_RUNTIME='C:\path\to\windows\bin' \
bun run turbo run test:windows-runtime --filter=@octane-xplat/tray

# Linux: a VM reachable over SSH with gjs, dbus-run-session, and xvfb.
TRAY_GTK_HOST=gtk-smoke@orb TRAY_GTK_DIRECT=1 \
bun run turbo run test:gtk-runtime --filter=@octane-xplat/tray

# macOS: packaged fixture app.
bun run turbo run test:macos-packaged --filter=@octane-xplat/tray
```

Unit tests cover menu normalization, validation, unsupported-host
reporting, and the Windows leaf's behavior when the Win32 projection is
absent.
