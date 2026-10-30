### Add configurable keyboard shortcuts

The optional `@octane-xplat/shortcuts` package adds scoped commands, sequences,
shortcut recording, atomic rebinding and dispatch diagnostics. Browser, GTK/X11 and WinUI input have runtime checks; AppKit has a native
event-queue check. Native desktop adapters remain experimental. Mobile hardware shortcuts are unsupported.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const shortcuts = createShortcuts({ target: document })
shortcuts.bind({ combo: 'Mod+k', preventDefault: true, handler: () => console.log('Open commands') })
// When the owner closes: shortcuts.dispose()
```

[Keyboard shortcuts guide](https://octane-xplat.goddardai.org/keyboard-shortcuts)
