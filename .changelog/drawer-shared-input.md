### Drag mobile drawers without activating nested buttons

Mobile Drawer now uses the shared gesture owner for edge opening and drag dismissal. A claimed drag cancels its nested button press, extra fingers cancel the drag until all contacts lift, and new commands or drags can interrupt settling at the current position. Web and desktop keep their explicit controls.

**Breaking change:** the native host is now composed from framework views. Remove ui-drawer-specific settings from `ios` and `android`, such as `gestureHandlerOptions`, `shouldPan`, `translationFunction` and `animationFunction`. Import Drawer and DrawerProps from `@octane-xplat/ui` and remove `@octane-xplat/drawer` from dependencies. Keep the same content and state callbacks. Drawer no longer installs ui-drawer or gesturehandler; other features may still need their own dependencies.

```tsx
import { Drawer } from '@octane-xplat/ui'

<Drawer open={open} onOpenChange={setOpen} width={280}
  main={mainContent} drawer={navigationContent} />
```

Keep visible open/close buttons for people who do not drag. See the [Drawer guide](https://octane-xplat.goddardai.org/drawer) for setup and native qualification limits.
