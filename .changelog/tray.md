---
hype: 60
---

### Keep a native app alive in the system tray

New `@octane-xplat/tray` package creates a persistent status-bar item on macOS (`NSStatusItem`) and a StatusNotifierItem on Linux over D-Bus, with icons, tooltip/title, activation events, context menus, and resident-app helpers to hide, show, or toggle the app windows.

```ts
import { createTray, getTrayAvailability, keepAppResident } from '@octane-xplat/tray'

if ((await getTrayAvailability()).available) {
	const release = await keepAppResident()
	const tray = await createTray({
		id: 'my-app',
		icon: { type: 'file', path: 'assets/tray.png', isTemplate: true },
		tooltip: 'My App',
		onActivate: () => toggleAppWindows(),
		menu: [
			{ type: 'action', key: 'open', label: 'Open', onSelect: () => showAppWindows() },
			{ type: 'separator', key: 'sep' },
			{ type: 'action', key: 'quit', label: 'Quit', onSelect: () => process.exit(0) },
		],
	})
	// later: tray.update({ title: '2' }); tray.destroy(); release()
}
```

Menus support actions, checkboxes, radio groups, submenus, sections, separators, and disabled items. Linux requires a StatusNotifier host (KDE, GNOME with the AppIndicator extension, or similar); desktops without one report `no-status-notifier-host`. Web, iOS, Android, and Windows report explicit unsupported states — the Windows runtime's tray primitives (Shell_NotifyIcon, message-window callbacks) are proven feasible on the packaged host but the leaf is not implemented yet.

Verified on a real packaged macOS `.app`, the NativeScript macOS JSC host, and a live D-Bus session with an external StatusNotifier watcher.

See [Tray](https://octane-xplat.goddardai.org/package-tray).
