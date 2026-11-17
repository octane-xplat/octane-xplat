# Desktop application services

> Add native menus, tray icons, and system-wide hotkeys from one package.

Use `@octane-xplat/desktop` in an existing native macOS, Linux GTK, or Windows app. A **tray icon** is the small app icon beside the system clock. A **global shortcut** runs even when your app does not have keyboard focus. Desktop hosts remain experimental; each feature guide describes its host requirements and verified limits.

```sh
bun add @octane-xplat/desktop
```

## Add a window menu

In your desktop startup file, call `installWindowMenu` after the host window has mounted. It adds a Window menu whose Show Windows command reveals the app's windows. Keep the returned cleanup function and call it before replacing the window root or ending its owner.

```ts
import { appMenu, showAppWindows } from '@octane-xplat/desktop'

export function installWindowMenu(): () => void {
  if (!appMenu.supported) {
    return () => {}
  }

  const menu = appMenu.install([
    {
      type: 'submenu',
      key: 'window',
      label: 'Window',
      items: [
        {
          type: 'action',
          key: 'show',
          label: 'Show Windows',
          onSelect: () => {
            showAppWindows()
          },
        },
      ],
    },
  ])

  return () => menu.dispose()
}
```

## Choose your next feature

All features use the package root. Imports do not create a tray icon, register a hotkey, install a menu, or keep the app running. The following imports introduce no owned resources; the feature guides show creation, failure handling, and cleanup.

```ts
import {
  appMenu,
  createTray,
  getTrayAvailability,
  createGlobalShortcuts,
  getGlobalShortcutSupport,
  keepAppResident,
} from '@octane-xplat/desktop'
```

- [Application menu](package-app-menu.md): menu trees, native commands, shortcuts, and menu ownership.
- [System tray](package-tray.md): icons, tray menus, app residency, and showing or hiding windows.
- [Global shortcuts](package-global-shortcuts.md): key assignments, conflicts, permissions, and cleanup.
- [Generated API reference](https://octane-xplat.goddardai.org/api-desktop): exported functions and types.

## Move an existing app

Replace dependencies on `@octane-xplat/app-menu`, `@octane-xplat/tray`, and `@octane-xplat/global-shortcuts` with `@octane-xplat/desktop`. Import their existing symbols from the root; the old packages and feature subpaths are not provided. Registration results, menu models, and cleanup contracts retain their existing behavior.

```ts
import {
  appMenu,
  createTray,
  createGlobalShortcuts,
  type Tray,
  type GlobalShortcuts,
} from '@octane-xplat/desktop'
```

Portable file access, clipboard, appearance, and notifications retain their existing packages. This package does not yet provide the proposed Electron-style window constructor, single-instance lifecycle, display catalog, shell service, or native dialog service.
