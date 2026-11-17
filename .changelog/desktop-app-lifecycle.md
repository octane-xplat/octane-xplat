### Wait for desktop startup and request a safe quit

On AppKit and Linux GTK, `app.whenReady()` waits for desktop startup and `app.quit()` requests shutdown. A synchronous `before-quit` listener or any managed secondary window's close listener can stop the request.

```ts
import { app } from '@octane-xplat/desktop'

export function protectUnsavedEdits(hasUnsavedEdits: () => boolean) {
  if (!app.supported) return
  app.on('before-quit', (event) => {
    if (hasUnsavedEdits()) event.preventDefault()
  })
}
```

See [Desktop application services](https://octane-xplat.goddardai.org/package-desktop#wait-for-startup-and-request-quit) for setup and an example.
