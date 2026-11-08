# System tray

`@octane-xplat/tray` creates native desktop tray icons (status items) with
menus, plus window visibility and residency helpers for tray-style apps.

- macOS AppKit: `NSStatusBar` status items with `NSMenu` menus.
- Linux GTK: StatusNotifierItem + `com.canonical.dbusmenu` over the D-Bus
  session bus in pure Gio — no appindicator typelibs required.
- Windows preview, browsers, WebView frontends and mobile report
  `unsupported-platform`/`unsupported-runtime` from `getTrayAvailability()`
  and reject `createTray` with `TrayError`.

```ts
import { createTray, getTrayAvailability, keepAppResident } from '@octane-xplat/tray'

const availability = await getTrayAvailability()
if (availability.available) {
	const tray = await createTray({
		id: 'my-app',
		icon: { type: 'named', name: 'star' },
		tooltip: 'My App',
		menu: [{ type: 'action', key: 'quit', label: 'Quit', onSelect: () => quit() }],
	})
	const residency = keepAppResident({ hideWindowsOnClose: true })
	// Later: tray.update({ title: 'New' }) / tray.destroy() / residency.release()
}
```

`TrayMenuItem` rows are field-compatible with `@octane-xplat/ui` `MenuOption`
data rows, so one menu definition can drive both the tray and in-app
`DropdownMenu`/`ContextMenu` components.
