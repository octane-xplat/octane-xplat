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

### Minimize an open window

Call `minimize()` to ask the desktop to minimize a window and `restore()` to bring it back. Its content stays mounted. On GTK, the window manager decides when to apply these requests. Both methods throw after the window closes. On experimental Windows hosts, they also throw `UnavailabilityError` if the native window presenter does not expose these controls.

```ts
import type { DesktopWindow } from '@octane-xplat/desktop'

export function minimizeInspector(inspector: DesktopWindow) {
  inspector.minimize()
}

export function restoreInspector(inspector: DesktopWindow) {
  inspector.restore()
}
```

### Save and restore a window's bounds

Use `getBounds()` and `setBounds()` to read or request the outer frame, including the title bar. Omitted fields in `setBounds()` keep their current values. Check `window.supportsBounds` first. AppKit uses logical units and Windows uses whole physical pixels, matching `screen.coordinateSpace`. GTK does not expose global window placement through this API. The window manager can constrain the resulting frame.

```ts
import { screen, type DesktopRectangle, type DesktopWindow } from '@octane-xplat/desktop'

export function restoreWindow(window: DesktopWindow, saved: DesktopRectangle) {
  if (!window.supportsBounds || !screen.supported) return

  const display = screen.getDisplayMatching(saved)
  if (!display) return

  const area = display.workArea ?? display.bounds
  const width = Math.min(saved.width, area.width)
  const height = Math.min(saved.height, area.height)
  window.setBounds({
    x: Math.max(area.x, Math.min(saved.x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(saved.y, area.y + area.height - height)),
    width,
    height,
  })
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

Canceling or closing the owner resolves with `{ canceled: true, filePaths: [] }`. A host failure rejects the promise. On the experimental NativeScript Windows host, rebuild the native app after adding or updating `@octane-xplat/desktop` so the app compiles the picker bridge. On Windows, only one desktop dialog can be open across the app. On AppKit and GTK, each owner can have one desktop dialog at a time.

```ts
export async function openFromInspector(inspector: DesktopWindow) {
  try {
    await openDocuments(inspector)
  } catch (error) {
    console.error('Could not open the native file dialog', error)
  }
}
```

## Choose where to save a file

Use `dialog.showSaveDialog(window, options)` to ask where to save a file. Pass a filename without a directory as `suggestedName`. The result gives you the selected path. Your app writes the file separately. Canceling or closing the owner returns `{ canceled: true, filePath: undefined }`. A host failure rejects the promise.

```ts
import { dialog, type DesktopWindow } from '@octane-xplat/desktop'

export async function exportNotes(
  inspector: DesktopWindow,
  writeNotes: (path: string) => Promise<void>,
) {
  if (!dialog.supported || !inspector.isVisible()) return

  const result = await dialog.showSaveDialog(inspector, {
    suggestedName: 'notes.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }],
  })

  if (!result.canceled) await writeNotes(result.filePath)
}
```

## Confirm before discarding changes

Use `dialog.showMessageBox(window, options)` to ask for a choice in a shown window. The result is a zero-based index into `buttons`. Set `defaultId` and `cancelId` to the safe option for destructive actions. Dismissing the dialog or closing its owner returns the cancel index. Use `dialog.supportsMessageBox` to check availability. AppKit and GTK support message boxes. On the experimental Windows host, rebuild the native app to include the bridge and use a host with Windows Common Controls version 6. A native failure rejects the promise.

```ts
import { dialog, type DesktopWindow } from '@octane-xplat/desktop'

export async function confirmDiscard(window: DesktopWindow) {
  if (!dialog.supportsMessageBox) return false

  const { response } = await dialog.showMessageBox(window, {
    message: 'Discard unsaved changes?',
    detail: 'Changes since the last save will be lost.',
    buttons: ['Keep Editing', 'Discard Changes'],
    defaultId: 0,
    cancelId: 0,
  })
  return response === 1
}
```

A close listener must veto the first request before opening the message box. Keep that window open while the user decides, and destroy it only after confirmation.

```ts
import type { DesktopWindowCloseEvent } from '@octane-xplat/desktop'

export function protectDraft(window: DesktopWindow, isDirty: () => boolean) {
  let deciding = false
  const onClose = (event: DesktopWindowCloseEvent) => {
    if (!isDirty()) return
    event.preventDefault()
    if (deciding) return

    deciding = true
    void confirmDiscard(window)
      .then((discard) => {
        if (discard && !window.isClosed) window.destroy()
      })
      .catch((error) => console.error('Could not ask about unsaved changes', error))
      .finally(() => { deciding = false })
  }

  window.on('close', onClose)
  return () => window.off('close', onClose)
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

## Move an item to Trash

Use `shell.trashItem(path)` with an absolute native path. Call it after the user chooses Move to Trash. AppKit, GTK, and supported Windows hosts provide this action. On Windows, rebuild the native app to include the Recycle Bin bridge. Check `shell.canTrashItem` before offering it. An unavailable Trash or a failed move rejects the promise, and the service has no permanent-delete fallback.

```ts
import { shell } from '@octane-xplat/desktop'

export async function moveToTrash(path: string) {
  if (shell.canTrashItem) {
    await shell.trashItem(path)
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

## Reopen a running desktop app

On AppKit and GTK, `app.on('activate', listener)` handles requests to reopen a running app. On macOS, a Dock click can send this request. On GTK, a second launch can send it through the running application's session bus connection. The listener receives whether the host sees a visible window. If your listener opens or reveals a window, call `event.preventDefault()` synchronously to suppress the host's default reopen action. Use `app.whenReady()` for initial setup. Check `app.supportsActivate` before subscribing.

```ts
import { app, type DesktopActivateEvent } from '@octane-xplat/desktop'

export function reopenMainWindow(showMainWindow: () => void) {
  if (!app.supportsActivate) return

  const reopen = (event: DesktopActivateEvent, hasVisibleWindows: boolean) => {
    if (hasVisibleWindows) return
    showMainWindow()
    event.preventDefault()
  }

  app.on('activate', reopen)
  return () => app.off('activate', reopen)
}
```

## Keep the app resident and control app windows

Tray apps and background helpers usually stay alive without visible windows. `keepAppResident` holds the app running after its last window closes until you call `release()` on the returned handle. Pass `hideWindowsOnClose: true` to retain the current windows so they can be shown again. Release the handle when its owner ends.

```ts
import { keepAppResident } from '@octane-xplat/desktop'

export function startResidency(): () => void {
  const residency = keepAppResident({ hideWindowsOnClose: true })
  return () => residency.release()
}
```

The window helpers control the app's top-level windows: `showAppWindows` reveals and focuses them and returns `false` when none exist, `hideAppWindows` hides the visible ones, `toggleAppWindows` switches visibility and returns the new state, and `areAppWindowsVisible` reports whether any app window is visible. They belong to the desktop app lifetime and work without creating a tray icon.

```ts
import {
  showAppWindows,
  hideAppWindows,
  toggleAppWindows,
  areAppWindowsVisible,
} from '@octane-xplat/desktop'

export const windowActions = {
  show: showAppWindows,
  hide: hideAppWindows,
  toggle: toggleAppWindows,
  isVisible: areAppWindowsVisible,
}
```

On macOS, `keepAppResident` disables automatic termination for the hold's lifetime, and `hideWindowsOnClose` retains the current windows by setting `releasedWhenClosed` to false; activation policy remains the host's responsibility. If the application delegate still returns true from `applicationShouldTerminateAfterLastWindowClosed`, `keepAppResident` throws — return false while the app stays resident. On Linux the hold uses `Gio.Application.hold`, and `hideWindowsOnClose` sets the current windows' hide-on-close flag; every helper needs a running `Gtk.Application`. On Windows the host keeps the process alive while JavaScript runs, so the hold is inert and `hideWindowsOnClose` is unimplemented.

```ts
import { app, keepAppResident } from '@octane-xplat/desktop'

export function holdOpenUntilQuit() {
  if (!app.supported) return () => {}
  const residency = keepAppResident()
  return () => residency.release()
}
```

On web and mobile these helpers throw `UnavailabilityError` whose `feature` names the called function. A Windows host without the packaged runtime's Win32 projection throws the same error. Check `app.supported` before wiring a shared action so unsupported hosts skip the call instead of throwing.

```ts
import { app, showAppWindows } from '@octane-xplat/desktop'

export function revealWindows(): boolean {
  return app.supported ? showAppWindows() : false
}
```

## Receive a second launch on GTK

Set `forwardSecondLaunch: true` in `runGtkApp()` to deliver arguments from a later launch to the running app. Both processes need the same application ID and D-Bus session. The later process exits without mounting another window. The original app receives the argument list without the launcher name and, when available, the caller's working directory. It then handles the usual `activate` event.

```ts
import { app, type DesktopSecondInstanceEvent } from '@octane-xplat/desktop'
import { runGtkApp } from '@octane-xplat/linux-gtk/host'

export function startGtkEditor(openDocuments: (paths: readonly string[], cwd?: string) => void) {
  return runGtkApp({ applicationId: 'dev.example.Editor', forwardSecondLaunch: true }, () => {
    if (!app.supportsSecondInstance) return

    const open = (_event: DesktopSecondInstanceEvent, args: readonly string[], cwd?: string) => {
      if (args.length > 0) openDocuments(args, cwd)
    }
    app.on('second-instance', open)
    return () => app.off('second-instance', open)
  })
}
```

## Redirect a second launch on Windows

On the experimental NativeScript Windows host, rebuild the native app to include the single-instance bridge. In the Windows startup entry, call `app.requestSingleInstanceLock()` before `Application.run()`. When it returns `true`, start the app and subscribe to `second-instance`. When it returns `false`, Windows has redirected the launch and the bridge exits the secondary process. The running app receives the arguments Windows supplied for a launch. Windows does not supply a working directory through this event.

```ts
import { app, type DesktopSecondInstanceEvent } from '@octane-xplat/desktop'

export function startWindowsEditor(
  mount: () => void,
  openDocuments: (paths: readonly string[]) => void,
) {
  if (!app.requestSingleInstanceLock()) return

  const open = (_event: DesktopSecondInstanceEvent, args: readonly string[]) => {
    if (args.length > 0) openDocuments(args)
  }
  app.on('second-instance', open)
  mount()
  return () => app.off('second-instance', open)
}
```

## Redirect a second launch on macOS

On the packaged AppKit host, call `app.requestSingleInstanceLock()` before `runMacOSApp()`. If it returns `false`, skip startup. The later process forwards its arguments and working directory to the running app, then exits. Check `app.supportsSingleInstanceLock` for host availability. The native service uses the app's bundle ID within the current login session and requires permission to register a Mach service. Finder reopening an app that is already running uses the usual `activate` event.

```ts
import { app, type DesktopSecondInstanceEvent } from '@octane-xplat/desktop'

export function startMacEditor(
  mount: () => void,
  openDocuments: (paths: readonly string[], cwd?: string) => void,
) {
  if (app.supportsSingleInstanceLock && !app.requestSingleInstanceLock()) return

  const open = (_event: DesktopSecondInstanceEvent, args: readonly string[], cwd?: string) => {
    if (args.length > 0) openDocuments(args, cwd)
  }
  if (app.supportsSecondInstance) app.on('second-instance', open)
  mount()
  return () => app.off('second-instance', open)
}
```

## Read the desktop display layout

Call `screen.getAllDisplays()` after startup to read connected displays. Each entry gives the display bounds and scale factor. Coordinates increase rightward and downward. AppKit and GTK use logical units. The Windows bridge uses physical pixels across the virtual desktop, so use `screen.coordinateSpace` before comparing coordinates. Windows apps need a native rebuild for the bridge.

```ts
import { app, screen } from '@octane-xplat/desktop'

export async function logDesktopDisplays() {
  if (!app.supported) return
  await app.whenReady()
  if (!screen.supported) return

  for (const display of screen.getAllDisplays()) {
    console.log(screen.coordinateSpace, display.bounds, display.scaleFactor)
  }
}
```

Use `screen.getDisplayMatching(rect)` with a rectangle in the same coordinate space. It selects the display with the greatest overlap, or the nearest display when the rectangle is off-screen. Use `workArea` when present to avoid reserved space like a taskbar. GTK omits the work area and may have no primary display.

```ts
import { screen, type DesktopRectangle } from '@octane-xplat/desktop'

export function restoreArea(rect: DesktopRectangle) {
  if (!screen.supported) return undefined

  const display = screen.getDisplayMatching(rect) ?? screen.getPrimaryDisplay()
  return display?.workArea ?? display?.bounds
}
```

### Respond when displays change

Subscribe with `screen.on()` after startup, then remove the same listener with `screen.off()` during cleanup. The events report displays added or removed and changed display metrics. A metrics event includes the changed fields from `bounds`, `workArea`, `scaleFactor`, and `isPrimary`. Windows compares a snapshot about once per second while listeners are installed.

```ts
import { screen, type DesktopScreenEvents } from '@octane-xplat/desktop'

export function watchDisplays(refreshLayout: () => void) {
  if (!screen.supported) return

  const refresh: DesktopScreenEvents['display-metrics-changed'] = (_event, _display, metrics) => {
    if (metrics.includes('workArea') || metrics.includes('bounds')) refreshLayout()
  }

  screen.on('display-added', refreshLayout)
  screen.on('display-removed', refreshLayout)
  screen.on('display-metrics-changed', refresh)

  return () => {
    screen.off('display-added', refreshLayout)
    screen.off('display-removed', refreshLayout)
    screen.off('display-metrics-changed', refresh)
  }
}
```

## Choose your next feature

All features use the package root. Imports do not create a tray icon, register a hotkey, install a menu, open a window, or keep the app running. The following imports introduce no owned resources; the feature guides show creation, failure handling, and cleanup.

```ts
import {
  app,
  appMenu,
  createTray,
  getTrayAvailability,
  createGlobalShortcuts,
  getGlobalShortcutSupport,
  windows,
  dialog,
  shell,
  screen,
  keepAppResident,
  showAppWindows,
} from '@octane-xplat/desktop'
```

- [Application menu](package-app-menu.md): menu trees, native commands, shortcuts, and menu ownership.
- [System tray](package-tray.md): icons, tray menus, and primary-click actions.
- [Global shortcuts](package-global-shortcuts.md): key assignments, conflicts, permissions, and cleanup.
- [Secondary windows](#open-a-second-window): `windows.open`, window handles, and close events.
- [App lifecycle](#wait-for-startup-and-request-quit): `app.whenReady`, `app.quit`, [reopen](#reopen-a-running-desktop-app) and second-launch events, and [app residency](#keep-the-app-resident-and-control-app-windows).
- [Native dialogs](#open-a-file-dialog-from-a-window): file pickers, [save dialogs](#choose-where-to-save-a-file), and [message boxes](#confirm-before-discarding-changes).
- [Shell actions](#open-a-web-link-in-the-default-browser): open links, [reveal files](#show-a-file-in-its-folder), and [move items to Trash](#move-an-item-to-trash).
- [Displays](#read-the-desktop-display-layout): `screen` display bounds, work areas, and [change events](#respond-when-displays-change).
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

Portable file access, clipboard, appearance, and notifications retain their existing packages.
