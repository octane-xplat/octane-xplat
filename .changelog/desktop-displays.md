### Read connected desktop displays

Inspect desktop display bounds, available work areas, and scale, or find the display that best matches a saved rectangle.

```ts
import { screen } from '@octane-xplat/desktop'

if (screen.supported) {
  console.log(screen.coordinateSpace, screen.getAllDisplays())
}
```

See [Read the desktop display layout](https://octane-xplat.goddardai.org/package-desktop#read-the-desktop-display-layout) for coordinate units and host capabilities.
