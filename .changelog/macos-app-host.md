---
hype: 60
---

### Run a macOS app with `runMacOSApp`

`@octane-xplat/macos-appkit/host` ships the AppKit application host as a public API: `runMacOSApp` creates the main window, mounts your universal root, presents it, and runs the event loop — no harness code to copy into your app.

```ts
import { runMacOSApp } from '@octane-xplat/macos-appkit/host'

runMacOSApp({ title: 'Notes' }, ({ root, window }) => {
  root.render(App, { parentWindow: window })
  return () => console.log('app is closing')
})
```

Importing `host` also installs the platform services `@octane-xplat/platform` reads on macOS (clipboard, storage, `openUrl`, app state, window size, `announce`, deep links) and the window service behind `openWindow` from `@octane-xplat/ui`; `setWindowContentResolver` maps each window request to the component to mount. `createAppKitWindow` and `createHostedWindow` cover hosts that manage their own lifecycle or mount non-Octane native views. See [Render Octane components in AppKit](https://octane-xplat.goddardai.org/package-macos-appkit#start-an-app).
