### Open a second window and request a safe quit on Windows

On the experimental NativeScript Windows host, `@octane-xplat/desktop` can open a second WinUI window and wait for desktop startup. Use `app.quit()` to let the app and every secondary window check for unsaved work before closing.

```ts
import { app, windows } from '@octane-xplat/desktop'

await app.whenReady()
const inspector = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
inspector.on('close', (event) => {
  if (hasUnsavedEdits()) event.preventDefault()
})
```

See [Desktop application services](https://octane-xplat.goddardai.org/package-desktop#open-a-second-window) to register the window content and wire up Quit.
