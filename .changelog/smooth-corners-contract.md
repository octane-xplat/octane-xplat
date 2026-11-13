### Dependable smooth-corner inputs and explicit platform behavior

SmoothCorners now uses Mason-owned path clipping on Android, preserving native backgrounds and scaling the complete border path for the device density. AppKit constructs real Core Graphics mask and shadow paths, and web shadows honor spread.

**Breaking change:** Android native shadows use `android.elevation`; passing `shadow` on Android throws. Arrange children with an inner shared layout instead of the removed flex-container props. Dynamic `style` must be a property object. Border/shadow colors accept CSS hex, comma-separated `rgb()`/`rgba()`, or `transparent`; invalid numeric inputs fail before drawing. Native Windows and GTK explicitly report unsupported.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'

;<SmoothCorners
  corners={24}
  android={{ elevation: 8 }}
  border={{ width: 2, color: '#2563eb80' }}
  style={{ width: 240, height: 120, overflow: 'hidden' }}
/>
```

See the [SmoothCorners guide](https://octane-xplat.goddardai.org/package-smooth-corners) for supported platforms, colors, shadows, and content layout.
