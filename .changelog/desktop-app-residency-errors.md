### App residency and window helpers report host capability

**Breaking change:** `showAppWindows`, `hideAppWindows`, `toggleAppWindows`, `areAppWindowsVisible`, and `keepAppResident` from `@octane-xplat/desktop` now throw `UnavailabilityError` — with `feature` naming the called function — on hosts that cannot control app windows, matching the package's other capability services. They no longer throw `TrayError` with `unsupported-platform` or `unsupported-runtime`. On Linux a helper called without a running `Gtk.Application` throws a plain `Error`. `TrayErrorCode` drops `resident-conflict`; a macOS delegate that still ends the app on last-window-close now makes `keepAppResident` throw a plain `Error`. Check `app.supported` before wiring a shared action.

```ts
import { app, showAppWindows } from '@octane-xplat/desktop'

if (app.supported) {
  showAppWindows()
}
```

See [Keep the app resident and control app windows](https://octane-xplat.goddardai.org/package-desktop#keep-the-app-resident-and-control-app-windows).
