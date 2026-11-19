# Desktop application services

> Add native menus, tray icons, secondary windows, and system-wide hotkeys from one package.

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

## Open a second window

Use a second window for an inspector or editor that should stay beside the main screen. On AppKit and Linux GTK, register the screen with your host's `setWindowContentResolver` at startup. The following is a macOS example. In a GTK startup file, import the resolver from `@octane-xplat/linux-gtk/host`.

```ts
import { setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
import Inspector from './Inspector.tsrx'

setWindowContentResolver((data) => {
  if (data && typeof data === 'object' && 'screen' in data && data.screen === 'inspector') {
    return Inspector
  }
})
```

On the experimental Windows NativeScript host, register the resolver on `Application` before startup. It returns a NativeScript `Page` for the requested window.

```ts
import { Application, Label, Page } from '@nativescript/core'

Application.setWindowContentResolver(({ isPrimary, data }) => {
  if (isPrimary || data?.screen !== 'inspector') return

  const page = new Page()
  const label = new Label()
  label.text = 'Inspector'
  page.content = label
  return page
})
```

After the main window has mounted, call `windows.open` from a menu or button action. Check `windows.supported` before showing the action. The check returns false on web and mobile. This service opens regular windows. The host runs the app and supplies window content.

```ts
import { windows } from '@octane-xplat/desktop'

export function openInspector(hasUnsavedEdits: () => boolean) {
  if (!windows.supported) return

  const inspector = windows.open({
    title: 'Inspector',
    data: { screen: 'inspector' },
  })

  inspector.on('close', (event) => {
    if (hasUnsavedEdits()) event.preventDefault()
  })
  inspector.on('closed', () => console.log('Inspector closed'))
  return inspector
}
```

### Show an existing window

Keep one Inspector window by saving its handle. When the user selects Open Inspector again, call `show()` on the saved window. Call `hide()` to put it away while keeping its content and state. After the user closes it, the next command creates a fresh window.

```ts
import { windows, type DesktopWindow } from '@octane-xplat/desktop'

let inspector: DesktopWindow | undefined

export function showInspector() {
  if (!windows.supported) return

  if (inspector && !inspector.isClosed) {
    inspector.show()
    return
  }

  inspector = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
}

export function hideInspector() {
  if (inspector && !inspector.isClosed) inspector.hide()
}
```

`show()` also requests keyboard focus. Use `focus()` when you only want to request focus for a window that is already shown. The desktop environment decides whether to grant focus. `isVisible()` reports whether the host shows the window and returns `false` after close. Calling `show()`, `hide()`, or `focus()` on a closed handle throws.

```ts
export function focusInspector() {
  if (inspector?.isVisible()) inspector.focus()
}
```

### Close the window

Calling `close()` requests the same close as the window's close button. Call `preventDefault()` before the listener returns to keep it open. Use `destroy()` for teardown when the window must close regardless of unsaved changes. The `closed` event and promise are delivered after the window's content has unmounted.

```ts
import type { DesktopWindow } from '@octane-xplat/desktop'

export function requestInspectorClose(inspector: DesktopWindow) {
  inspector.close()
}

export async function disposeInspector(inspector: DesktopWindow) {
  inspector.destroy()
  await inspector.closed
}
```

## Open a file dialog from a window

Use `dialog.showOpenDialog(window, options)` from a shown window created with `windows.open()`. The native picker is modal to that window. Check `dialog.supported` before offering the command. The picker accepts file extensions without a leading dot and can return multiple paths.

```ts
import { dialog, type DesktopWindow } from '@octane-xplat/desktop'

export async function openDocuments(inspector: DesktopWindow) {
  if (!dialog.supported || !inspector.isVisible()) return

  const result = await dialog.showOpenDialog(inspector, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Text documents', extensions: ['txt', 'md'] }],
  })

  if (result.canceled) return
  for (const path of result.filePaths) console.log(path)
}
```

Canceling or closing the owner resolves with `{ canceled: true, filePaths: [] }`. A host failure rejects the promise. On the experimental NativeScript Windows host, rebuild the native app after adding or updating `@octane-xplat/desktop` so the app compiles the picker bridge. The Windows bridge allows one Open dialog at a time.

```ts
export async function openFromInspector(inspector: DesktopWindow) {
  try {
    await openDocuments(inspector)
  } catch (error) {
    console.error('Could not open the native file dialog', error)
  }
}
```

## Open a web link in the default browser

Use `shell.openExternal()` for an HTTP or HTTPS link that should open outside your app. Check `shell.supported` before offering the action. The promise resolves when the host accepts the request and rejects if it declines.

```ts
import { shell } from '@octane-xplat/desktop'

export async function openHelp() {
  if (shell.supported) {
    await shell.openExternal('https://example.org/help')
  }
}
```

## Show a file in its folder

Use `shell.showItemInFolder(path)` after saving or exporting a file. Pass its absolute native path. The promise resolves when the host accepts the request. On Linux, this action requires a file manager that implements the FileManager1 interface on the session bus.

```ts
import { shell } from '@octane-xplat/desktop'

export async function revealExport(path: string) {
  if (shell.canShowItemInFolder) {
    await shell.showItemInFolder(path)
  }
}
```

## Wait for startup and request quit

On AppKit, GTK, and the experimental Windows NativeScript host, use `app.whenReady()` to wait until the primary window has mounted. Put setup that needs a running app in the callback. On web and mobile, `app.supported` is false.

```ts
import { app } from '@octane-xplat/desktop'

if (app.supported) {
  void app.whenReady().then(() => console.log('Desktop startup is complete'))
}
```

Use `app.quit()` after readiness when a user selects Quit. A `before-quit` listener can stop the attempt synchronously. If the app allows quit, the host checks the close guards on managed secondary windows before closing them. A window veto keeps the app and all its windows open. A later quit attempt runs the checks again. On Windows, create every secondary window with `windows.open`. If the guards allow quit but a secondary window was opened directly through NativeScript, `app.quit()` throws before closing any window. Native last-window behavior follows the host’s policy.

```ts
import { app, type DesktopBeforeQuitEvent } from '@octane-xplat/desktop'

export function protectUnsavedWork(hasUnsavedWork: () => boolean) {
  const protect = (event: DesktopBeforeQuitEvent) => {
    if (hasUnsavedWork()) event.preventDefault()
  }

  app.on('before-quit', protect)
  return () => app.off('before-quit', protect)
}

export async function quitFromSettings() {
  await app.whenReady()
  app.quit()
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

Portable file access, clipboard, appearance, and notifications retain their existing packages. This package does not yet provide single-instance lifecycle, a display catalog, a shell service, or native dialogs.
