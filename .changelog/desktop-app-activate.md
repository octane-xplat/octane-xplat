### Reopen a running desktop app

Listen for native reopen requests to bring a window back when somebody reopens your running app on AppKit or GTK.

```ts
import { app, showAppWindows } from '@octane-xplat/desktop'

if (app.supportsActivate) {
  app.on('activate', (event, hasVisibleWindows) => {
    if (!hasVisibleWindows && showAppWindows()) event.preventDefault()
  })
}
```

See [Reopen a running desktop app](https://octane-xplat.goddardai.org/package-desktop#reopen-a-running-desktop-app).
