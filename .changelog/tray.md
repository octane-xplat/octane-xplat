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

Menus support actions, checkboxes, radio groups, submenus, sections, separators, and disabled items. Linux requires a StatusNotifier host (KDE, GNOME with the AppIndicator extension, or similar); desktops without one report `no-status-notifier-host`. Windows uses `Shell_NotifyIconW` with `TrackPopupMenu` menus; file icons must be `.ico`, named icons map to stock icon ids. Web, iOS, and Android report explicit unsupported states.

Verified on a real packaged macOS `.app`, the NativeScript macOS JSC host, a live D-Bus session with an external StatusNotifier watcher, and the packaged Windows host (real notification-area rect, activation, menu selection, and removal end to end).

See [Tray](https://octane-xplat.goddardai.org/package-tray).
