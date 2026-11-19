### Receive arguments from a second GTK launch

Opt in to forward launch arguments and the caller's working directory to your running GTK app over D-Bus.

```ts
import { app } from '@octane-xplat/desktop'
import { runGtkApp } from '@octane-xplat/linux-gtk/host'

runGtkApp({ applicationId: 'dev.example.Editor', forwardSecondLaunch: true }, () => {
  if (!app.supportsSecondInstance) return
  const open = (_event: unknown, args: readonly string[]) => console.log(args)
  app.on('second-instance', open)
  return () => app.off('second-instance', open)
})
```

See [Receive a second launch on GTK](https://octane-xplat.goddardai.org/package-desktop#receive-a-second-launch-on-gtk).
