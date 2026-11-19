### Drag mobile drawers without activating nested buttons

On iOS and Android, drag from the screen edge to open a drawer or drag the panel to dismiss it. Once the drag starts, releasing your finger won’t activate a nested button. A second finger cancels the drag. You can grab the drawer again while it is settling.

**Breaking change**

Import `Drawer` and `DrawerProps` from `@octane-xplat/ui` and remove `@octane-xplat/drawer`. Remove old native drawer options such as `shouldPan` and `animationFunction` from `ios` and `android`. Keep your content and open-state callbacks.

```tsx
import { Drawer } from '@octane-xplat/ui'

<Drawer open={open} onOpenChange={setOpen} width={280}
  main={mainContent} drawer={navigationContent} />
```

Keep visible open and close controls for web, desktop, and people who don’t use drag gestures.

[Drawer setup](https://octane-xplat.goddardai.org/drawer)
