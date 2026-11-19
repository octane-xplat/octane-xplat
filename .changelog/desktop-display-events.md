### Respond to desktop display changes

Watch for connected or removed monitors and changes to a display's bounds, work area, scale, or primary status.

```ts
import { screen } from '@octane-xplat/desktop'

if (screen.supported) {
  const refresh = () => console.log(screen.getAllDisplays())
  screen.on('display-removed', refresh)
  // When the owner is done:
  screen.off('display-removed', refresh)
}
```

See [Respond when displays change](https://octane-xplat.goddardai.org/package-desktop#respond-when-displays-change).
