### Track window state and reach the app's main window

`DesktopWindow` from `@octane-xplat/desktop` gains `maximize()`, `unmaximize()`, `isMaximized()`, `isMinimized()`, and `move`/`resize`/`maximize`/`unmaximize` events, so apps can persist and restore Electron-style window state. `windows.getAllWindows()` lists the app's main window first, then windows opened through `windows.open()` in creation order, and `windows.getFocusedWindow()` reports which of them holds keyboard focus. The main-window handle is a full `DesktopWindow`: its `close` listeners veto the title-bar button, `close()`, and `app.quit()`, and it can own native dialogs. `move` and `resize` require `supportsBounds`; on GTK they and `isMinimized()` throw `UnavailabilityError`, and the window manager may ignore maximize requests.

```ts
import { windows } from '@octane-xplat/desktop'

const main = windows.getAllWindows()[0]
if (main?.supportsBounds) {
  main.on('resize', () => console.log('resized to', main.getBounds()))
}
main?.maximize()
```

See [Find the app's windows](https://octane-xplat.goddardai.org/package-desktop#find-the-apps-windows) and [Save and restore a window's bounds](https://octane-xplat.goddardai.org/package-desktop#save-and-restore-a-windows-bounds).
