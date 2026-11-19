### Redirect second launches on macOS

The packaged AppKit host now accepts command-line arguments. Claim the single-instance lock before mounting your app to receive later launches in the running instance.

```ts
import { app } from '@octane-xplat/desktop'

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', (_event, argv, cwd) => console.log(argv, cwd))
  mountApp()
}
```

See [Redirect a second launch on macOS](https://octane-xplat.goddardai.org/package-desktop#redirect-a-second-launch-on-macos).
