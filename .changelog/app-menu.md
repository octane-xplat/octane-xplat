---
hype: 60
---

### Install a native application menu bar on desktop

New `@octane-xplat/app-menu` package installs the native application menu bar — `NSApplication.mainMenu` on macOS the `Gtk.Application` menubar on Linux, and native buttons with attached `MenuFlyout`s on Windows — with action items, nested submenus, separators, disabled and controlled checkbox state, keyboard accelerators, and platform role items such as Copy and Quit on AppKit and GTK.

```ts
import { appMenu } from '@octane-xplat/app-menu'

const handle = appMenu.install([
  { type: 'submenu', key: 'file', label: 'File', items: [
    { type: 'action', key: 'new', label: 'New', accelerator: 'Mod+N', onSelect: createDocument },
  ]},
])

handle.update(nextMenus)
handle.dispose()
```

Updates replace the whole tree and retire stale callbacks, `dispose` restores the previous menu bar, and one owner is allowed per process. This is separate from in-window `DropdownMenu`/`ContextMenu` surfaces and from tray/status-bar icons. Web, iOS, and Android report `supported: false` and throw `UnavailabilityError` on install. Windows requires the pinned NativeScript host and a mounted primary window; dispose before root replacement or window closure. Windows rejects standard role entries; supply action callbacks instead. Alt/F10 menu-bar navigation and automatic propagation to additional windows are not provided.

See [Application menu](https://octane-xplat.goddardai.org/package-app-menu).
