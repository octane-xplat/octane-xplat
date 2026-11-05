---
hype: 50
---

### Add Drawer to the GTK4/GJS target

`@octane-xplat/drawer` now renders on Linux GTK. The panel docks to the start edge and fills the window height over a modal scrim; backdrop presses and Escape dismiss it, and controlled `open`, `onOpenChange`, and `onDismiss` behave like the desktop leaves. The `gtk` export condition resolves the leaf automatically — no import changes needed.

```tsx
import { Drawer } from '@octane-xplat/drawer'
import { Text } from '@octane-xplat/ui'

export function Nav() {
  return (
    <Drawer
      defaultOpen
      main={<Text>Content</Text>}
      drawer={<Text>Panel</Text>}
    />
  )
}
```

See [Add a side drawer](https://github.com/octane-xplat/octane-xplat/tree/main/docs/app/drawer.md).
