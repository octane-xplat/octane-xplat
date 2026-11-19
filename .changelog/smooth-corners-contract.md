### Clip SmoothCorners reliably and validate its styles

On iOS and Android, `SmoothCorners` preserves the native background when `overflow: hidden` clips children to the curve. Android borders scale correctly with screen density. AppKit uses the curve for clipping and shadows, and web shadows honor spread.

**Breaking change**

On Android, replace `shadow` with `android.elevation`. Lay out children in an inner stack and pass dynamic `style` as an object. Use hex, comma-separated `rgb()` or `rgba()`, or `transparent` for border and shadow colors. Windows and GTK remain unsupported.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'

export const example = <SmoothCorners
  corners={24}
  android={{ elevation: 8 }}
  border={{ width: 2, color: '#2563eb80' }}
  style={{ width: 240, height: 120, overflow: 'hidden' }}
/>
```

See the [SmoothCorners guide](https://octane-xplat.goddardai.org/package-smooth-corners) for supported platforms, colors, shadows, and content layout.
