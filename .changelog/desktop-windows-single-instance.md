### Redirect second launches on Windows

Claim the single-instance lock in the Windows startup entry before mounting the app. The running instance receives later launch arguments.

```ts
import { app } from '@octane-xplat/desktop'

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', (_event, argv) => console.log(argv))
  mountApp()
}
```

See [Redirect a second launch on Windows](https://octane-xplat.goddardai.org/package-desktop#redirect-a-second-launch-on-windows).
